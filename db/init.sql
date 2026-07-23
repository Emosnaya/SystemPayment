-- =============================================================================
-- SistemPayment — Esquema inicial de PostgreSQL
-- Define las tablas base del sistema de pagos: usuarios, tarjetas y pagos.
-- Cumple PCI-DSS: no se almacenan números de tarjeta completos, solo
-- los últimos 4 dígitos (ultimos_cuatro).
-- =============================================================================

-- Extensión para generar UUIDs con gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Tabla: usuarios
-- Almacena la información básica de cada usuario del sistema.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre          VARCHAR(150)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    fecha_creacion  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  usuarios              IS 'Usuarios registrados en el sistema de pagos';
COMMENT ON COLUMN usuarios.id           IS 'Identificador único del usuario (UUID)';
COMMENT ON COLUMN usuarios.nombre       IS 'Nombre completo del usuario';
COMMENT ON COLUMN usuarios.email        IS 'Correo electrónico único del usuario';
COMMENT ON COLUMN usuarios.fecha_creacion IS 'Fecha y hora de registro del usuario';

-- -----------------------------------------------------------------------------
-- Tabla: tarjetas
-- Métodos de pago asociados a un usuario.
-- Solo se guardan los últimos 4 dígitos por cumplimiento PCI-DSS.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tarjetas (
    id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id       UUID            NOT NULL,
    titular          VARCHAR(150)    NOT NULL,
    ultimos_cuatro   VARCHAR(4)      NOT NULL,
    fecha_expiracion DATE            NOT NULL,
    fecha_creacion   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_tarjetas_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id)
        ON DELETE CASCADE,

    -- Valida que ultimos_cuatro contenga exactamente 4 dígitos numéricos
    CONSTRAINT chk_ultimos_cuatro
        CHECK (ultimos_cuatro ~ '^\d{4}$')
);

COMMENT ON TABLE  tarjetas                 IS 'Tarjetas de pago asociadas a un usuario (solo últimos 4 dígitos)';
COMMENT ON COLUMN tarjetas.id              IS 'Identificador único de la tarjeta (UUID)';
COMMENT ON COLUMN tarjetas.usuario_id      IS 'FK al usuario propietario de la tarjeta';
COMMENT ON COLUMN tarjetas.titular         IS 'Nombre del titular tal como aparece en la tarjeta';
COMMENT ON COLUMN tarjetas.ultimos_cuatro  IS 'Últimos 4 dígitos de la tarjeta (PCI-DSS)';
COMMENT ON COLUMN tarjetas.fecha_expiracion IS 'Fecha de expiración de la tarjeta';
COMMENT ON COLUMN tarjetas.fecha_creacion  IS 'Fecha y hora de registro de la tarjeta';

-- Índice en FK para acelerar búsquedas de tarjetas por usuario
CREATE INDEX IF NOT EXISTS idx_tarjetas_usuario_id ON tarjetas (usuario_id);

-- -----------------------------------------------------------------------------
-- Tabla: pagos
-- Registro de transacciones de pago procesadas en el sistema.
-- El estado solo puede ser APPROVED o REJECTED.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pagos (
    id           UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id   UUID            NOT NULL,
    tarjeta_id   UUID            NOT NULL,
    monto        DECIMAL(12, 2)  NOT NULL,
    estado       VARCHAR(20)     NOT NULL,
    fecha_pago   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_pagos_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_pagos_tarjeta
        FOREIGN KEY (tarjeta_id)
        REFERENCES tarjetas (id)
        ON DELETE RESTRICT,

    -- El monto debe ser estrictamente positivo
    CONSTRAINT chk_pagos_monto
        CHECK (monto > 0),

    -- Estados permitidos según la prueba técnica
    CONSTRAINT chk_pagos_estado
        CHECK (estado IN ('APPROVED', 'REJECTED'))
);

COMMENT ON TABLE  pagos             IS 'Transacciones de pago procesadas en el sistema';
COMMENT ON COLUMN pagos.id          IS 'Identificador único del pago (UUID)';
COMMENT ON COLUMN pagos.usuario_id  IS 'FK al usuario que realizó el pago';
COMMENT ON COLUMN pagos.tarjeta_id  IS 'FK a la tarjeta utilizada en el pago';
COMMENT ON COLUMN pagos.monto       IS 'Monto de la transacción (hasta 2 decimales)';
COMMENT ON COLUMN pagos.estado      IS 'Resultado del pago: APPROVED o REJECTED';
COMMENT ON COLUMN pagos.fecha_pago  IS 'Fecha y hora en que se procesó el pago';

-- Índices en FKs para acelerar consultas de pagos por usuario o tarjeta
CREATE INDEX IF NOT EXISTS idx_pagos_usuario_id ON pagos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagos_tarjeta_id ON pagos (tarjeta_id);
`)