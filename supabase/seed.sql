-- StoryQuest Admin CMS Demo Data
-- Run this SQL in Supabase SQL Editor after running schema.sql

-- Clean up existing demo data
DELETE FROM placed_models WHERE chapter_id IN (
  SELECT id FROM chapters WHERE book_id IN (
    SELECT id FROM books WHERE title LIKE '%[데모]%'
  )
);
DELETE FROM trigger_zones WHERE chapter_id IN (
  SELECT id FROM chapters WHERE book_id IN (
    SELECT id FROM books WHERE title LIKE '%[데모]%'
  )
);
DELETE FROM scenes WHERE book_id IN (
  SELECT id FROM books WHERE title LIKE '%[데모]%'
);
DELETE FROM chapters WHERE book_id IN (
  SELECT id FROM books WHERE title LIKE '%[데모]%'
);
DELETE FROM books WHERE title LIKE '%[데모]%';

-- Demo Book 1: 이상한 나라의 앨리스
INSERT INTO books (id, title, author, manuscript) VALUES 
(
  'demo-book-alice',
  '[데모] 이상한 나라의 앨리스',
  '루이스 캐럴',
  '앨리스는 언니 옆에 앉아 있었습니다. 너무 지루해서 졸음이 쏟아졌습니다.'
);

INSERT INTO chapters (id, book_id, title, order_index, content, environment_asset_id) VALUES 
('demo-ch-alice-1', 'demo-book-alice', '1장: 토끼굴로', 0, '앨리스는 언니 옆 강둑에 앉아 할 일이 없어 지루해하고 있었습니다.', NULL),
('demo-ch-alice-2', 'demo-book-alice', '2장: 눈물의 연못', 1, '앨리스가 "이상하고 이상해!"라고 외쳤습니다.', NULL),
('demo-ch-alice-3', 'demo-book-alice', '3장: 미친 다과회', 2, '집 앞 나무 아래에 탁자가 놓여 있었습니다.', NULL);

-- Demo Book 2: 빨간 모자
INSERT INTO books (id, title, author, manuscript) VALUES 
(
  'demo-book-redhood',
  '[데모] 빨간 모자',
  '그림 형제',
  '옛날 옛적에 빨간 모자를 쓴 소녀가 살았습니다.'
);

INSERT INTO chapters (id, book_id, title, order_index, content, environment_asset_id) VALUES 
('demo-ch-redhood-1', 'demo-book-redhood', '1장: 심부름', 0, '옛날 옛적에 모두에게 사랑받는 귀여운 소녀가 살았습니다.', NULL),
('demo-ch-redhood-2', 'demo-book-redhood', '2장: 숲속의 늑대', 1, '빨간 모자가 숲으로 들어서자 늑대가 나타났습니다.', NULL);

-- Demo Book 3: 피터팬
INSERT INTO books (id, title, author, manuscript) VALUES 
(
  'demo-book-peterpan',
  '[데모] 피터팬',
  'J.M. 배리',
  '모든 아이들은 자랍니다. 딱 한 명만 빼고요.'
);

INSERT INTO chapters (id, book_id, title, order_index, content, environment_asset_id) VALUES 
('demo-ch-peterpan-1', 'demo-book-peterpan', '1장: 피터를 만나다', 0, '웬디 달링은 런던의 한 집에서 동생들과 함께 살았습니다.', NULL),
('demo-ch-peterpan-2', 'demo-book-peterpan', '2장: 하늘을 날다', 1, '팅커벨이 요정 가루를 뿌리자 아이들이 공중에 떠올랐습니다!', NULL);

-- Note: placed_models will be added through the UI by dragging assets to the 3D viewer
-- The demo data generation is handled in-app via the 🎭 button
