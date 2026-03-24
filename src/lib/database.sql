-- Split Expenses — Database Schema
-- Run this SQL in your Supabase SQL Editor to create the required tables.

-- Rooms table
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(6) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Participants table
CREATE TABLE participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Expenses table
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  paid_by UUID REFERENCES participants(id),
  description VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Expense splits table (many-to-many: which participants share an expense)
CREATE TABLE expense_splits (
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  PRIMARY KEY (expense_id, participant_id)
);

-- Enable realtime subscriptions for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE participants, expenses, expense_splits;

-- Row Level Security (RLS) policies
-- Allow anonymous access filtered by room_id

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

-- Rooms: anyone can read and insert
CREATE POLICY "Allow public read on rooms" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on rooms" ON rooms
  FOR INSERT WITH CHECK (true);

-- Participants: anyone can read and insert for any room
CREATE POLICY "Allow public read on participants" ON participants
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on participants" ON participants
  FOR INSERT WITH CHECK (true);

-- Expenses: anyone can read and insert for any room
CREATE POLICY "Allow public read on expenses" ON expenses
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on expenses" ON expenses
  FOR INSERT WITH CHECK (true);

-- Expense splits: anyone can read and insert
CREATE POLICY "Allow public read on expense_splits" ON expense_splits
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on expense_splits" ON expense_splits
  FOR INSERT WITH CHECK (true);
