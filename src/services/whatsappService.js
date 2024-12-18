const axios = require('axios');
const pool = require('../config/database');

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

  async salvarContato(apiKey) {
    try {
      // Buscar informações do usuário pelo api_key
      const [usuarios] = await pool.execute(
        'SELECT telefone FROM usuarios WHERE api_key = ?',
        [apiKey]
      );

      if (usuarios.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      const numeroDestino = usuarios[0].telefone;
      
      // Dados fixos do contato
      const contato = {
        fullName: "lembreto",
        wuid: "5563933001247",
        phoneNumber: numeroDestino,
        organization: "triks",
        email: "contato@triks.digital",
        url: "lembreto.com"
      };

      // Enviar requisição para salvar o contato
      const response = await axios.post(
        `${this.baseUrl}/message/sendContact/${this.instance}`,
        {
          apikey: this.apiKey,
          number: numeroDestino,
          contact: [contato]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        numero: numeroDestino,
        ...response.data
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new WhatsAppService();
