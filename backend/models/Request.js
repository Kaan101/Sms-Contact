const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  rawText: {
    type: String,
    required: [true, 'Lütfen talebinizi belirtiniz'],
    trim: true
  },
  disambiguationChoice: {
    type: String,
    default: null // Örn: "Buz pateni sahası", "Buz pateni ayakkabısı"
  },
  keywords: [{
    type: String
  }],
  userContact: {
    contactValue: { type: String, required: true }, // Telefon no veya e-posta
    preferredChannel: { 
      type: String, 
      enum: ['PHONE', 'SMS', 'WHATSAPP', 'EMAIL'], 
      default: 'PHONE' 
    }
  },
  status: {
    type: String,
    enum: ['PENDING', 'MATCHED', 'MANUAL_INTERVENTION', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  matchedProviderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Request', RequestSchema);