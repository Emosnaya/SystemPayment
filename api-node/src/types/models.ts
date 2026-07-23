export interface User {
  id: string;
  nombre: string;
  email: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Card {
  id: string;
  usuario_id: string;
  titular: string;
  ultimos_cuatro: string;
  fecha_expiracion: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type PaymentStatus = "APPROVED" | "REJECTED";

export interface Payment {
  id: string;
  usuario_id: string;
  tarjeta_id: string;
  monto: string;
  estado: PaymentStatus;
  transaction_id: string | null;
  fecha_pago: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
