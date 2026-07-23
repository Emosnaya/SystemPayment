-- =============================================================================
-- SystemPayment — Esquema inicial de PostgreSQL (producción)
-- Tablas: usuarios, tarjetas, pagos.
-- PCI-DSS: nunca se almacenan números de tarjeta completos, solo ultimos_cuatro.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Auditoría: actualiza updated_at en cada UPDATE
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Tabla: usuarios
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre      VARCHAR(150)    NOT NULL,
    email       VARCHAR(255)    NOT NULL,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ     NULL,

    CONSTRAINT uq_usuarios_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email
    ON usuarios (email)
    WHERE deleted_at IS NULL;

CREATE TRIGGER trg_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE PROCEDURE set_updated_at();

COMMENT ON TABLE  usuarios             IS 'Usuarios del sistema de pagos';
COMMENT ON COLUMN usuarios.email       IS 'Correo único del usuario';
COMMENT ON COLUMN usuarios.deleted_at  IS 'Soft delete; NULL = activo';

-- -----------------------------------------------------------------------------
-- Tabla: tarjetas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tarjetas (
    id               UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id       UUID            NOT NULL,
    titular          VARCHAR(150)    NOT NULL,
    ultimos_cuatro   VARCHAR(4)      NOT NULL,
    fecha_expiracion DATE            NOT NULL,
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ     NULL,

    CONSTRAINT fk_tarjetas_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id)
        ON DELETE CASCADE,

    CONSTRAINT chk_ultimos_cuatro
        CHECK (ultimos_cuatro ~ '^\d{4}$')
);

CREATE INDEX IF NOT EXISTS idx_tarjetas_usuario_id
    ON tarjetas (usuario_id)
    WHERE deleted_at IS NULL;

CREATE TRIGGER trg_tarjetas_updated_at
    BEFORE UPDATE ON tarjetas
    FOR EACH ROW
    EXECUTE PROCEDURE set_updated_at();

COMMENT ON TABLE  tarjetas                IS 'Tarjetas asociadas a un usuario (solo últimos 4 dígitos)';
COMMENT ON COLUMN tarjetas.ultimos_cuatro IS 'Últimos 4 dígitos (PCI-DSS)';
COMMENT ON COLUMN tarjetas.deleted_at     IS 'Soft delete; NULL = activa';

-- -----------------------------------------------------------------------------
-- Tabla: pagos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pagos (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id      UUID            NOT NULL,
    tarjeta_id      UUID            NOT NULL,
    monto           DECIMAL(12, 2)  NOT NULL,
    estado          VARCHAR(20)     NOT NULL,
    transaction_id  VARCHAR(100)    NULL,
    fecha_pago      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ     NULL,

    CONSTRAINT fk_pagos_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_pagos_tarjeta
        FOREIGN KEY (tarjeta_id)
        REFERENCES tarjetas (id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_pagos_monto
        CHECK (monto > 0),

    CONSTRAINT chk_pagos_estado
        CHECK (estado IN ('APPROVED', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_pagos_usuario_id
    ON pagos (usuario_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pagos_tarjeta_id
    ON pagos (tarjeta_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pagos_transaction_id
    ON pagos (transaction_id)
    WHERE transaction_id IS NOT NULL;

CREATE TRIGGER trg_pagos_updated_at
    BEFORE UPDATE ON pagos
    FOR EACH ROW
    EXECUTE PROCEDURE set_updated_at();

COMMENT ON TABLE  pagos                 IS 'Transacciones de pago procesadas';
COMMENT ON COLUMN pagos.estado          IS 'APPROVED o REJECTED';
COMMENT ON COLUMN pagos.transaction_id  IS 'ID de transacción del microservicio Python';
COMMENT ON COLUMN pagos.deleted_at      IS 'Soft delete; NULL = vigente';
