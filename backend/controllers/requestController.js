exports.assignProviderManually = async (req, res) => {
  try {
    const { requestId, providerId } = req.body;

    console.log(`[WOZ ASSIGN ATTEMPT] Request ID: ${requestId}, Provider ID: ${providerId}`);

    if (!requestId || !providerId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Talep ID ve Servis Sağlayıcı ID zorunludur.' 
      });
    }

    const rId = parseInt(requestId, 10);
    const pId = parseInt(providerId, 10);

    if (isNaN(rId) || isNaN(pId)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'ID değerleri geçerli bir tam sayı olmalıdır.' 
      });
    }

    // 1. Sağlayıcının varlığını doğrudan veritabanında sorgula
    const { rows: providerRows } = await pool.query(
      'SELECT id, name, phone FROM service_providers WHERE id = $1',
      [pId]
    );

    if (providerRows.length === 0) {
      // Hata anında veritabanındaki mevcut tüm sağlayıcı ID'lerini görebilmek için loglayalım
      const { rows: allProvs } = await pool.query('SELECT id, name FROM service_providers');
      console.log('Mevcut Sağlayıcılar:', allProvs);

      return res.status(404).json({
        status: 'error',
        message: `ID'si ${pId} olan sağlayıcı veritabanında bulunamadı. Lütfen sayfayı yenileyin.`
      });
    }

    // 2. Talebi güncelle
    const updateQuery = `
      UPDATE requests
      SET matched_provider_id = $1,
          status = 'MATCHED'
      WHERE id = $2
      RETURNING *;
    `;

    const { rows: updatedRows } = await pool.query(updateQuery, [pId, rId]);

    if (updatedRows.length === 0) {
      return res.status(404).json({ 
        status: 'error', 
        message: `ID'si ${rId} olan talep bulunamadı.` 
      });
    }

    console.log(`[WOZ ASSIGN SUCCESS] Request ${rId} -> Provider ${pId} (${providerRows[0].name})`);

    res.status(200).json({
      status: 'success',
      message: `Talep '${providerRows[0].name}' sağlayıcısına başarıyla atandı.`,
      request: updatedRows[0]
    });
  } catch (error) {
    console.error('Manuel atama hatası:', error);
    res.status(500).json({ 
      status: 'error', 
      message: `Sunucu hatası: ${error.message}` 
    });
  }
};