-- Auto-generated migration script for events
-- Source: u676616277_hs_original.sql (calendarEvents)
-- Total records: 11

INSERT INTO events (title, start_datetime, end_datetime, is_all_day, description, google_cal_id, location_id, created_at, modified_at)
VALUES
  ('PreSeason', '2024-07-22 10:47:00', '2024-08-11 10:47:00', 1, NULL, 'kj6g7oml62oldbg0keav4svl18', NULL, '2023-12-27 16:47:52', '2023-12-27 17:20:50'),
  ('Regular Season', '2024-08-12 11:26:00', '2024-10-01 11:27:00', 1, NULL, 'edt9ke4vnp3n933hc0vtbkma70', NULL, '2023-12-27 17:27:45', '2023-12-27 17:27:45'),
  ('Post Season', '2024-10-02 11:28:00', '2024-10-26 11:29:00', 1, NULL, 'n4qh5ibrphnc0p9eofgnn6iqf4', NULL, '2023-12-27 17:29:39', '2023-12-27 17:29:39'),
  ('Dead Period', '2024-06-24 16:02:00', '2024-07-07 16:02:00', 1, NULL, '0mffuhr31bl2414u5oop46knlk', NULL, '2023-12-27 22:02:51', '2023-12-28 17:48:28'),
  ('Tryout Period', '2024-07-08 08:42:00', '2024-07-19 08:42:00', 1, NULL, 't82spmn2v9g7j60nuafavsd318', NULL, '2023-12-28 14:46:23', '2023-12-28 16:35:41'),
  ('1/2 Day School', '2024-08-05 21:13:00', '2024-08-05 21:13:00', 1, NULL, 'hv2n9t5t8sbapfnde3m54gqihc', NULL, '2024-02-02 03:14:00', '2024-02-02 03:14:00'),
  ('No School', '2024-09-02 21:14:00', '2024-09-02 21:14:00', 1, NULL, 'c547v1f64prr5b5bm8pdus69e4', NULL, '2024-02-02 03:14:30', '2024-02-02 03:14:30'),
  ('Fall Break', '2024-10-07 21:15:00', '2024-10-11 21:15:00', 1, NULL, '2r3qnt5kv36qjg5cv45h42gcvc', NULL, '2024-02-02 03:15:32', '2024-02-02 03:15:32'),
  ('Youth Summer Camp', '2024-06-17 17:00:00', '2024-06-20 20:00:00', 0, NULL, 'sn593lm7nftqg52v5epvc5jd1k', NULL, '2024-02-06 22:28:35', '2024-02-06 22:30:23'),
  ('Alumni Game', '2024-06-22 17:00:00', '2024-06-22 19:00:00', 0, NULL, 'tfia72r7tgu825o4n0oor6c4kg', 189, '2024-03-06 23:05:48', '2024-03-06 23:05:48'),
  ('Little Eagles Soccer Camp', '2024-06-17 09:00:00', '2024-06-20 11:00:00', 0, NULL, '0b3fvgagsst2qkmshmrtv92ols', 189, '2024-04-10 18:39:09', '2024-04-10 18:39:09');
