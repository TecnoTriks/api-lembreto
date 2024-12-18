const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.baseUrl = process.env.WHATSAPP_BASE_URL;
    this.instance = process.env.WHATSAPP_INSTANCE;
    this.apiKey = process.env.WHATSAPP_API_KEY;
  }

  async enviarMensagem(telefone, mensagem, delay = 1200) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/message/sendText/${this.instance}`,
        {
          apikey: this.apiKey,
          phone: telefone,
          message: mensagem,
          delay: delay
        }
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async verificarNumeros(numeros) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/whatsappNumbers/${this.instance}`,
        { numbers: numeros },
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.apiKey
          }
        }
      );

      // Processa a resposta usando o campo exists
      const resultados = response.data.map(item => ({
        numero: item.number,
        verificado: item.exists,
        jid: item.jid || null
      }));

      return resultados;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new WhatsAppService();
