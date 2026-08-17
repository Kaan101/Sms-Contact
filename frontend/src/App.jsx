const handleSaveProvider = async (e) => {
    e.preventDefault();
    const keywordsArray = formData.serviceKeywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);

    const payload = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      serviceKeywords: keywordsArray,
      communicationChannels: formData.communicationChannels,
      priorityScore: Number(formData.priorityScore)
    };

    try {
      if (editingProviderId) {
        await axios.put(`${API_BASE}/providers/${editingProviderId}`, payload);
      } else {
        await axios.post(`${API_BASE}/providers`, payload);
      }
      setIsModalOpen(false);
      
      // Hem sağlayıcıları hem de admin verilerini eşzamanlı tazele
      await Promise.all([fetchProviders(), fetchAdminData()]);
      
    } catch (err) {
      alert('Kayıt başarısız: ' + (err.response?.data?.message || err.message));
    }
  };