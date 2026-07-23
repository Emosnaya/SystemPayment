-- =============================================================================
-- SystemPayment — Datos semilla (idempotente)
-- =============================================================================

INSERT INTO usuarios (id, nombre, email)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Usuario Demo',
    'demo@sistempayment.com'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO tarjetas (id, usuario_id, titular, ultimos_cuatro, fecha_expiracion)
VALUES (
    '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
    '550e8400-e29b-41d4-a716-446655440000',
    'Usuario Demo',
    '4242',
    '2028-12-31'
)
ON CONFLICT (id) DO NOTHING;
