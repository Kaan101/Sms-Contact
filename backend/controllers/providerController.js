const { pool } = require('../config/db');

// Yardımcı: Telefonu son 10 haneye indirger (örn: 5323002301)
const getNormalizedLast10 = (p) => {
  if (!p) return '';
  const digits = p.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

// Yardımcı: Etiketleri güvenli bir şekilde diziye çevirir (tags veya tag destekli)
// Gelişmiş Etiket Çözümleyici (Nesne, Dizi veya String destekli)
const parseTags = (inputTags) => {
  if (!inputTags) return [];
  
  // Eğer dizi olarak geldiyse (İçerisinde nesne veya string olabilir)
  if (Array.isArray(inputTags)) {
    return inputTags.map(item => {
      if (!item) return '';
      // Eğer eleman bir nesneyse (örn: {id: 1, name: 'tesisat'} veya {tag: 'tesisat'})
      if (typeof item === 'object') {
        return String(item.name || item.tag || item.tag_name || item.label || Object.values(item)[0] || '').trim().toLowerCase();
      }
      // Düz metinse
      return String(item).trim().toLowerCase();
    }).filter(Boolean);
  }
  
  // Eğer virgülle ayrılmış string olarak geldiyse
  if (typeof inputTags === 'string') {
    return inputTags.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  }
  
  return [];
};

// 1. Yeni Servis Veren Ekleme (Tags / Tag Destekli)
const registerProvider = async (req, res) => {
  try {
    const { 
      name, phone, email, serviceKeywords, communicationChannels, 
      priorityScore, source,
      address, country, city, district, neighborhood,
      postalCode, providerType, providerSubtype, description
    } = req.body;

    // Frontend 'tags' veya 'tag' göndermiş olabilir, her ikisini de kontrol edelim
    const rawTags = req.body.tags !== undefined ? req.body.tags : req.body.tag;

    if (!name || !phone || !serviceKeywords || !communicationChannels) {
      return res.status(400).json({
        status: 'error',
        message: 'İsim, telefon, anahtar kelimeler ve iletişim kanalları zorunludur.'
      });
    }

    const keywordsArray = Array.isArray(serviceKeywords) 
      ? serviceKeywords.map(s => String(s).trim().toLowerCase()).filter(Boolean)
      : String(serviceKeywords).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

    const tagsArray = parseTags(rawTags);

    const channelsArray = Array.isArray(communicationChannels)
      ? communicationChannels
      : ['PHONE'];

    const providerSource = source ? source.toUpperCase().trim() : 'MANUAL';
    const providerCountry = country ? country.trim() : 'Türkiye';

    const insertQuery = `
      INSERT INTO service_providers 
      (name, phone, email, service_keywords, tags, communication_channels, priority_score, source, 
       address, country, city, district, neighborhood,
       postal_code, provider_type, provider_subtype, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *;
    `;

    const values = [
      name.trim(),
      phone.trim(),
      email && email.trim() !== '' ? email.trim() : null,
      keywordsArray,
      tagsArray,
      channelsArray,
      parseInt(priorityScore, 10) || 100,
      providerSource,
      address && address.trim() !== '' ? address.trim() : null,
      providerCountry,
      city && city.trim() !== '' ? city.trim() : null,
      district && district.trim() !== '' ? district.trim() : null,
      neighborhood && neighborhood.trim() !== '' ? neighborhood.trim() : null,
      postalCode && postalCode.trim() !== '' ? postalCode.trim() : null,
      providerType && providerType.trim() !== '' ? providerType.trim() : null,
      providerSubtype && providerSubtype.trim() !== '' ? providerSubtype.trim() : null,
      description && description.trim() !== '' ? description.trim() : null
    ];

    const { rows } = await pool.query(insertQuery, values);

    res.status(201).json({
      status: 'success',
      message: 'Servis veren başarıyla eklendi.',
      provider: rows[0]
    });
  } catch (error) {
    console.error('Servis veren ekleme hatası:', error);
    res.status(500).json({ status: 'error', message: `Sunucu hatası: ${error.message}` });
  }
};

// 2. Tüm Servis Verenleri Getirme
const getProviders = async (req, res) => {
  try {
    const selectQuery = `
      SELECT * FROM service_providers 
      ORDER BY is_active DESC, priority_score DESC, id ASC;
    `;
    const { rows } = await pool.query(selectQuery);

    res.status(200).json({
      status: 'success',
      providers: rows
    });
  } catch (error) {
    console.error('Servis verenleri getirme hatası:', error);
    res.status(500).json({ status: 'error', message: `Sunucu hatası: ${error.message}` });
  }
};

// 3. Telefon Numarasına Göre Sağlayıcı Bilgisi Getir
const getProviderByPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ status: 'error', message: 'Telefon parametresi zorunludur.' });

    const rawPhone = phone.trim();
    const last10 = getNormalizedLast10(rawPhone);

    const query = `
      SELECT * FROM service_providers 
      WHERE phone = $1 
         OR RIGHT(REGEXP_REPLACE(phone, '\\D', '', 'g'), 10) = $2
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [rawPhone, last10]);

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'not_found',
        message: 'Bu telefon numarasıyla kayıtlı servis sağlayıcı bulunamadı.'
      });
    }

    res.status(200).json({
      status: 'success',
      provider: rows[0]
    });
  } catch (error) {
    console.error('getProviderByPhone hatası:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 4. Servis Veren Güncelleme (Gelişmiş Tags / Tag Desteği)
const updateProvider = async (req, res) => {
  try {
    const { id } = req.params;

// 🔍 Gelen veriyi konsola yazdırarak kontrol edelim
    console.log(`[DEBUG] Güncelleme İsteği ID: ${id}, Body:`, req.body);
   
    const { 
      name, phone, email, serviceKeywords, communicationChannels, 
      priorityScore, isActive,
      address, country, city, district, neighborhood,
      postalCode, providerType, providerSubtype, description 
    } = req.body;

    // Frontend 'tags' veya 'tag' göndermiş olabilir
    const rawTags = req.body.tags !== undefined ? req.body.tags : req.body.tag;

    const keywordsArray = serviceKeywords !== undefined ? (
      Array.isArray(serviceKeywords) 
        ? serviceKeywords.map(s => String(s).trim().toLowerCase()).filter(Boolean)
        : String(serviceKeywords).split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    ) : null;

    const tagsArray = rawTags !== undefined ? parseTags(rawTags) : null;

    const channelsArray = communicationChannels !== undefined ? (
      Array.isArray(communicationChannels) 
        ? communicationChannels 
        : ['PHONE']
    ) : null;

    const updateQuery = `
      UPDATE service_providers
      SET 
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        email = COALESCE($3, email),
        service_keywords = COALESCE($4, service_keywords),
        tags = COALESCE($5, tags),
        communication_channels = COALESCE($6, communication_channels),
        priority_score = COALESCE($7, priority_score),
        is_active = COALESCE($8, is_active),
        address = COALESCE($9, address),
        country = COALESCE($10, country),
        city = COALESCE($11, city),
        district = COALESCE($12, district),
        neighborhood = COALESCE($13, neighborhood),
        postal_code = COALESCE($14, postal_code),
        provider_type = COALESCE($15, provider_type),
        provider_subtype = COALESCE($16, provider_subtype),
        description = COALESCE($17, description)
      WHERE id = $18
      RETURNING *;
    `;

    const values = [
      name ? name.trim() : null,
      phone ? phone.trim() : null,
      email !== undefined ? (email && email.trim() !== '' ? email.trim() : null) : null,
      keywordsArray,
      tagsArray,
      channelsArray,
      priorityScore !== undefined && priorityScore !== '' ? parseInt(priorityScore, 10) : null,
      isActive !== undefined ? isActive : null,
      address !== undefined ? (address && address.trim() !== '' ? address.trim() : null) : null,
      country !== undefined ? (country && country.trim() !== '' ? country.trim() : null) : null,
      city !== undefined ? (city && city.trim() !== '' ? city.trim() : null) : null,
      district !== undefined ? (district && district.trim() !== '' ? district.trim() : null) : null,
      neighborhood !== undefined ? (neighborhood && neighborhood.trim() !== '' ? neighborhood.trim() : null) : null,
      postalCode !== undefined ? (postalCode && postalCode.trim() !== '' ? postalCode.trim() : null) : null,
      providerType !== undefined ? (providerType && providerType.trim() !== '' ? providerType.trim() : null) : null,
      providerSubtype !== undefined ? (providerSubtype && providerSubtype.trim() !== '' ? providerSubtype.trim() : null) : null,
      description !== undefined ? (description && description.trim() !== '' ? description.trim() : null) : null,
      id
    ];

    const { rows } = await pool.query(updateQuery, values);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Servis veren bulunamadı.' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Profil başarıyla güncellendi.',
      provider: rows[0]
    });
  } catch (error) {
    console.error('Servis veren güncelleme hatası:', error);
    res.status(500).json({ status: 'error', message: `Sunucu hatası: ${error.message}` });
  }
};

// 5. Servis Veren Silme
const deleteProvider = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('UPDATE requests SET matched_provider_id = NULL WHERE matched_provider_id = $1;', [id]);
    const { rows } = await pool.query('DELETE FROM service_providers WHERE id = $1 RETURNING *;', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Servis veren bulunamadı.' });
    }

    res.status(200).json({ status: 'success', message: 'Servis veren silindi.' });
  } catch (error) {
    console.error('Servis veren silme hatası:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  registerProvider,
  getProviders,
  getProviderByPhone,
  updateProvider,
  deleteProvider
};