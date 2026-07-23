export interface User {
  id: string;
  nombre: string;
  email: string;
  fecha_creacion: Date;
}

export interface Card {
  id: string;
  usuario_id: string;
  titular: string;
  ultimos_cuatro: string;
  fecha_expiracion: Date;
  fecha_creacion: Date;
}

export type PaymentStatus = "APPROVED" | "REJECTED";

export interface Payment {
  id: string;
  usuario_id: string;
  tarjeta_id: string;
  monto: string;
  estado: PaymentStatus;
  fecha_pago: Date;
}
