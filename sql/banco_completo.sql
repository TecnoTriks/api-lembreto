-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Tempo de geração: 18/12/2024 às 19:41
-- Versão do servidor: 10.11.10-MariaDB
-- Versão do PHP: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `u258304317_lembreto`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `lembretes`
--

CREATE TABLE `lembretes` (
  `id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `tipo` enum('Contas a Pagar','Saúde','Normal') NOT NULL,
  `data_hora` datetime DEFAULT NULL,
  `recorrente` tinyint(1) DEFAULT 0,
  `frequencia` enum('Diária','Semanal','Mensal','Anual') DEFAULT NULL,
  `status` enum('Ativo','Concluído','Cancelado') DEFAULT 'Ativo',
  `usuario_id` int(11) NOT NULL,
  `dia` int(11) DEFAULT NULL,
  `hora` time DEFAULT NULL,
  `data` date DEFAULT NULL,
  `dia_semana` enum('Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado') DEFAULT NULL,
  `mes` enum('Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `lembretes_tags`
--

CREATE TABLE `lembretes_tags` (
  `lembrete_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `notificacoes`
--

CREATE TABLE `notificacoes` (
  `id` int(11) NOT NULL,
  `lembrete_id` int(11) NOT NULL,
  `data_envio` datetime NOT NULL,
  `tipo_envio` enum('WhatsApp','SMS') NOT NULL,
  `status` enum('Sucesso','Falha') DEFAULT 'Sucesso',
  `mensagem` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Acionadores `notificacoes`
--
DELIMITER $$
CREATE TRIGGER `trg_after_notificacao_insert` AFTER INSERT ON `notificacoes` FOR EACH ROW BEGIN
    IF NEW.status = 'Sucesso' THEN
        UPDATE lembretes
        SET status = 'Concluído'
        WHERE id = NEW.lembrete_id;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tags`
--

CREATE TABLE `tags` (
  `id` int(11) NOT NULL,
  `nome` varchar(50) NOT NULL,
  `cor` varchar(7) DEFAULT '#FFFFFF',
  `icone` varchar(100) DEFAULT NULL,
  `usuario_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `tags`
--

INSERT INTO `tags` (`id`, `nome`, `cor`, `icone`, `usuario_id`) VALUES
(23, 'test1', '#eab308', '😄', 12);

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `telefone` varchar(20) NOT NULL,
  `data_criacao` timestamp NULL DEFAULT current_timestamp(),
  `status` enum('Ativo','Inativo') DEFAULT 'Ativo',
  `api_key` varchar(100) DEFAULT NULL,
  `foto_perfil` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `nome`, `email`, `senha`, `telefone`, `data_criacao`, `status`, `api_key`, `foto_perfil`) VALUES
(12, 'Matheus', 'tecnotriks@gmail.com', '$2a$10$Vn0WkX0dCMYNEAxejShHz.Fu99.BwaowTx1V57J9U5bx/Am./FNlC', '63984193411', '2024-12-18 18:15:30', 'Ativo', '1a06376f3c4369d645a7d4f487a60ffc3101f5bfce7b2f242466c3b47c023a7d', NULL);

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `lembretes`
--
ALTER TABLE `lembretes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `data_hora` (`data_hora`),
  ADD KEY `tipo` (`tipo`),
  ADD KEY `idx_lembretes_usuario_data` (`usuario_id`,`data_hora`);

--
-- Índices de tabela `lembretes_tags`
--
ALTER TABLE `lembretes_tags`
  ADD PRIMARY KEY (`lembrete_id`,`tag_id`),
  ADD KEY `lembrete_id` (`lembrete_id`),
  ADD KEY `tag_id` (`tag_id`);

--
-- Índices de tabela `notificacoes`
--
ALTER TABLE `notificacoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lembrete_id` (`lembrete_id`),
  ADD KEY `data_envio` (`data_envio`),
  ADD KEY `tipo_envio` (`tipo_envio`),
  ADD KEY `status` (`status`),
  ADD KEY `idx_notificacoes_tipo_status` (`tipo_envio`,`status`);

--
-- Índices de tabela `tags`
--
ALTER TABLE `tags`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `nome` (`nome`),
  ADD KEY `idx_tags_usuario_nome` (`usuario_id`,`nome`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `telefone` (`telefone`),
  ADD UNIQUE KEY `api_key` (`api_key`),
  ADD KEY `email_2` (`email`),
  ADD KEY `telefone_2` (`telefone`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `lembretes`
--
ALTER TABLE `lembretes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT de tabela `notificacoes`
--
ALTER TABLE `notificacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `tags`
--
ALTER TABLE `tags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `lembretes`
--
ALTER TABLE `lembretes`
  ADD CONSTRAINT `lembretes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `lembretes_tags`
--
ALTER TABLE `lembretes_tags`
  ADD CONSTRAINT `lembretes_tags_ibfk_1` FOREIGN KEY (`lembrete_id`) REFERENCES `lembretes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lembretes_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `notificacoes`
--
ALTER TABLE `notificacoes`
  ADD CONSTRAINT `notificacoes_ibfk_1` FOREIGN KEY (`lembrete_id`) REFERENCES `lembretes` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `tags`
--
ALTER TABLE `tags`
  ADD CONSTRAINT `tags_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;