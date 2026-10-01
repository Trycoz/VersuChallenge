# Datos Nortia Supply

- **Fecha de corte:** 2026-09-27 (domingo). Los datos reflejan todo lo registrado hasta el cierre de ese día.
- **Saldo en cuenta corriente al corte:** 270.000.000 (moneda local, sin decimales)
- Todos los montos incluyen impuestos cuando corresponde y están en moneda local, sin decimales.

## Archivos

**clientes.csv** — un registro por cliente.
`dias_credito` es el plazo de pago acordado. `limite_credito` es el máximo que se le permite deber.

**facturas.csv** — documentos emitidos por Nortia.
- `tipo`: `factura` o `nota_credito`. Las notas de crédito tienen montos negativos y apuntan a la factura que corrigen en `documento_referencia`.
- Una nota de crédito puede anular una factura completa (y a veces se emite una factura de reemplazo, que apunta a la original en `documento_referencia`) o corregir solo una parte (devoluciones).
- `en_disputa`: `si` cuando el cliente reclamó la factura y aún no se resuelve.

**pagos.csv** — pagos recibidos de clientes.
- `facturas_referencia`: factura o facturas que el cliente declara pagar.
- Un pago puede cubrir varias facturas (en ese caso las paga completas) o solo una parte de una factura (pagos en cuotas).

**obligaciones.csv** — pagos que Nortia debe hacer: proveedores, sueldos, arriendo, impuestos, servicios y crédito bancario.
- `estado`: `pagada` o `pendiente`. Incluye obligaciones conocidas hasta 2026-12-27.
- Las obligaciones futuras de sueldos, impuestos y servicios son estimaciones.
