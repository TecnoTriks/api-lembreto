-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Tempo de geração: 17/12/2024 às 18:38
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
-- Estrutura para tabela `lembretes_tags`
--

CREATE TABLE `lembretes_tags` (
  `lembrete_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `lembretes_tags`
--
ALTER TABLE `lembretes_tags`
  ADD PRIMARY KEY (`lembrete_id`,`tag_id`),
  ADD KEY `lembrete_id` (`lembrete_id`),
  ADD KEY `tag_id` (`tag_id`);

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `lembretes_tags`
--
ALTER TABLE `lembretes_tags`
  ADD CONSTRAINT `lembretes_tags_ibfk_1` FOREIGN KEY (`lembrete_id`) REFERENCES `lembretes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lembretes_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;