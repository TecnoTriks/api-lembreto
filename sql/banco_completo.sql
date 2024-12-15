

-- 2. Tabelas Principais

-- 2.1. Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) UNIQUE NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    INDEX (email),
    INDEX (telefone)
) ENGINE=InnoDB;

-- 2.2. Tabela de Lembretes
CREATE TABLE IF NOT EXISTS lembretes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo ENUM('Contas a Pagar', 'Saúde', 'Normal') NOT NULL,
    data_hora DATETIME NOT NULL,
    recorrente BOOLEAN DEFAULT FALSE,
    frequencia ENUM('Diária', 'Semanal', 'Mensal', 'Anual') NULL,
    status ENUM('Ativo', 'Concluído', 'Cancelado') DEFAULT 'Ativo',
    usuario_id INT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX (usuario_id),
    INDEX (data_hora),
    INDEX (tipo)
) ENGINE=InnoDB;

-- 2.3. Tabela de Tags
CREATE TABLE IF NOT EXISTS tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    cor VARCHAR(7) DEFAULT '#FFFFFF',
    icone VARCHAR(100) DEFAULT NULL,
    usuario_id INT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX (usuario_id),
    INDEX (nome)
) ENGINE=InnoDB;

-- 2.4. Tabela de Relacionamento Lembretes_Tags (N:N)
CREATE TABLE IF NOT EXISTS lembretes_tags (
    lembrete_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (lembrete_id, tag_id),
    FOREIGN KEY (lembrete_id) REFERENCES lembretes(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    INDEX (lembrete_id),
    INDEX (tag_id)
) ENGINE=InnoDB;

-- 2.5. Tabela de Notificações
CREATE TABLE IF NOT EXISTS notificacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lembrete_id INT NOT NULL,
    data_envio DATETIME NOT NULL,
    tipo_envio ENUM('WhatsApp', 'SMS') NOT NULL,
    status ENUM('Sucesso', 'Falha') DEFAULT 'Sucesso',
    mensagem TEXT,
    FOREIGN KEY (lembrete_id) REFERENCES lembretes(id) ON DELETE CASCADE,
    INDEX (lembrete_id),
    INDEX (data_envio),
    INDEX (tipo_envio),
    INDEX (status)
) ENGINE=InnoDB;

-- 3. Índices e Otimizações Adicionais

-- Índice composto para melhorar a performance das consultas de lembretes por usuário e data_hora
CREATE INDEX idx_lembretes_usuario_data ON lembretes(usuario_id, data_hora);

-- Índice composto para tags por usuário e nome
CREATE INDEX idx_tags_usuario_nome ON tags(usuario_id, nome);

-- Índice para notificações por tipo_envio e status
CREATE INDEX idx_notificacoes_tipo_status ON notificacoes(tipo_envio, status);

-- 4. Stored Procedures e Triggers (Opcional)

-- Exemplo de Trigger para atualizar o status do lembrete após a criação de uma notificação de sucesso
DELIMITER //

CREATE TRIGGER trg_after_notificacao_insert
AFTER INSERT ON notificacoes
FOR EACH ROW
BEGIN
    IF NEW.status = 'Sucesso' THEN
        UPDATE lembretes
        SET status = 'Concluído'
        WHERE id = NEW.lembrete_id;
    END IF;
END;
//

DELIMITER ;

