const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL;
    this.apiKey = process.env.WHATSAPP_API_KEY;
  }

  async enviarMensagem(telefone, mensagem, delay = 1200) {
    try {
      const response = await axios.post(this.apiUrl, {
        apikey: this.apiKey,
        phone: telefone,
        message: mensagem,
        delay: delay
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new WhatsAppService();
