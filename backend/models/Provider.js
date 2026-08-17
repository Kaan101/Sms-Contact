const mongoose = require('mongoose');

const ProviderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Servis veren adı zorunludur']
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  serviceKeywords: [{
    type: String,
    lowercase: true,
    trim: true
  }], // Örn: ["pizza", "tarabya pizza", "italyan pizza", "koltuk döşeme"]
  communicationChannels: [{
    type: String,
    enum: ['PHONE', 'SMS', 'WHATSAPP', 'EMAIL']
  }],
  priorityScore: {
    type: Number,
    default: 100 // Sadakat/Önceliklendirme puanı
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Provider', ProviderSchema);