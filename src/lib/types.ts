export interface Room {
  id: string;
  code: string;
  created_at: string;
}

export interface Participant {
  id: string;
  room_id: string;
  name: string;
  created_at: string;
}

export interface Expense {
  id: string;
  room_id: string;
  paid_by: string;
  description: string;
  amount: number;
  created_at: string;
}

export interface ExpenseSplit {
  expense_id: string;
  participant_id: string;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}
