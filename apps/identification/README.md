# Redcard Coupon API — Serverless

REST API serverless construida con **Hono** + **AWS Lambda / ECS**, usando PostgreSQL como base de datos.

**Base URL:** `/api/v1`

---

## Stack

- **Runtime**: Node.js 20.x (AWS Lambda / ECS)
- **Framework**: Hono
- **Build**: esbuild (< 10ms, minificado)
- **DB**: PostgreSQL 16 — driver `pg`, ORM propio
- **Migraciones**: sistema custom basado en timestamps

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Build dev (ambos targets) |
| `npm run build:prod` | Build producción minificado |
| `npm run dev` | Servidor local ECS (ts-node) |
| `npm run migrate` | Aplicar migraciones pendientes |

---

## Health

| Method | Path |
|--------|------|
| `GET` | `/api/v1/health` |

```json
{ "status": "ok" }
```

---

## Coupons — `/api/v1/coupon`

| Method | Path | Descripción |
|--------|------|-------------|
| `GET` | `/coupon` | Listar todos |
| `GET` | `/coupon/:id` | Obtener por UUID |
| `GET` | `/coupon/code/:code` | Obtener por código |
| `POST` | `/coupon` | Crear |
| `PUT` | `/coupon/:id` | Actualizar |
| `DELETE` | `/coupon/:id` | Eliminar |

### Create / Update DTO

```json
{
  "code": "SUMMER25",
  "name": "Summer Sale 25%",
  "startDate": "2026-06-01",
  "endDate": "2026-06-30",
  "description": "Descuento de verano",
  "isActive": true,
  "maxUses": 500
}
```

| Campo | Tipo | Requerido | Notas |
|-------|------|:---------:|-------|
| `code` | `string` | ✅ Create | Único, max 50 chars |
| `name` | `string` | ✅ Create | Max 120 chars |
| `startDate` | `string` | ✅ Create | ISO date `YYYY-MM-DD` |
| `endDate` | `string` | ✅ Create | ISO date `YYYY-MM-DD` |
| `description` | `string \| null` | — | |
| `isActive` | `boolean` | — | Default `true` |
| `maxUses` | `number \| null` | — | `null` = sin límite |

### Response DTO

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "code": "SUMMER25",
  "name": "Summer Sale 25%",
  "description": "Descuento de verano",
  "startDate": "2026-06-01T00:00:00.000Z",
  "endDate": "2026-06-30T00:00:00.000Z",
  "isActive": true,
  "maxUses": 500,
  "usedCount": 0,
  "createdAt": "2026-04-28T12:00:00.000Z",
  "updatedAt": "2026-04-28T12:00:00.000Z"
}
```

---

## Influencers — `/api/v1/influencer`

| Method | Path | Descripción |
|--------|------|-------------|
| `GET` | `/influencer` | Listar todos |
| `GET` | `/influencer/:id` | Obtener por UUID |
| `POST` | `/influencer` | Crear |
| `PUT` | `/influencer/:id` | Actualizar |
| `DELETE` | `/influencer/:id` | Eliminar |

### Create / Update DTO

```json
{
  "fullName": "María López",
  "platform": "instagram",
  "username": "marialopez",
  "email": "maria@example.com",
  "commissionRate": 10.5,
  "isActive": true
}
```

| Campo | Tipo | Requerido | Notas |
|-------|------|:---------:|-------|
| `fullName` | `string` | ✅ Create | Max 150 chars |
| `platform` | `string` | ✅ Create | `instagram` \| `tiktok` \| `youtube` \| otros |
| `username` | `string \| null` | — | Único en la plataforma |
| `email` | `string \| null` | — | Único, max 200 chars |
| `commissionRate` | `number` | — | Default `0` |
| `isActive` | `boolean` | — | Default `true` |

### Response DTO

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "fullName": "María López",
  "username": "marialopez",
  "platform": "instagram",
  "email": "maria@example.com",
  "commissionRate": 10.5,
  "isActive": true,
  "createdAt": "2026-04-28T12:00:00.000Z"
}
```

---

## Discounts — `/api/v1/discount`

Los descuentos pueden existir de forma independiente (sin código de cupón) o estar asociados a un cupón. Sin endpoint de update.

| Method | Path | Descripción |
|--------|------|-------------|
| `GET` | `/discount` | Listar todos |
| `GET` | `/discount/:id` | Obtener por UUID |
| `GET` | `/discount/standalone` | Descuentos sin cupón asociado |
| `GET` | `/discount/coupon/:couponId` | Descuentos de un cupón específico |
| `POST` | `/discount` | Crear |
| `DELETE` | `/discount/:id` | Eliminar |

### Create DTO

```json
{
  "discountType": "percentage",
  "discountValue": 25.00,
  "appliesTo": "all",
  "couponId": "550e8400-e29b-41d4-a716-446655440000",
  "initialDate": "2026-06-01",
  "endDate": "2026-06-30",
  "minDays": 3,
  "maxDays": 14,
  "minOrderAmount": 50.00,
  "maxDiscountAmount": 100.00,
  "allowedCountries": ["PE", "CL"],
  "deniedCountries": null,
  "allowedOffices": null,
  "deniedOffices": null
}
```

| Campo | Tipo | Requerido | Valores válidos |
|-------|------|:---------:|-----------------|
| `discountType` | `string` | ✅ | `percentage` \| `fixed_amount` \| `free_shipping` |
| `discountValue` | `number` | ✅ | |
| `appliesTo` | `string` | ✅ | `all` \| `categories` \| `products` |
| `couponId` | `uuid \| null` | — | `null` = descuento independiente (sin código) |
| `initialDate` | `string \| null` | — | Fecha de inicio de vigencia `YYYY-MM-DD` |
| `endDate` | `string \| null` | — | Fecha de fin de vigencia `YYYY-MM-DD` |
| `minDays` | `number \| null` | — | Mínimo de días de la reserva/orden |
| `maxDays` | `number \| null` | — | Máximo de días de la reserva/orden |
| `minOrderAmount` | `number \| null` | — | Monto mínimo de orden |
| `maxDiscountAmount` | `number \| null` | — | Límite máximo de descuento |
| `allowedCountries` | `string[] \| null` | — | Países permitidos (ISO2 o cualquier string) |
| `deniedCountries` | `string[] \| null` | — | Países excluidos |
| `allowedOffices` | `number[] \| null` | — | IDs de oficinas permitidas |
| `deniedOffices` | `number[] \| null` | — | IDs de oficinas excluidas |

### Response DTO

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "couponId": null,
  "discountType": "percentage",
  "discountValue": 25.00,
  "appliesTo": "all",
  "initialDate": "2026-06-01T00:00:00.000Z",
  "endDate": "2026-06-30T00:00:00.000Z",
  "minDays": 3,
  "maxDays": 14,
  "minOrderAmount": 50.00,
  "maxDiscountAmount": 100.00,
  "allowedCountries": ["PE", "CL"],
  "deniedCountries": null,
  "allowedOffices": null,
  "deniedOffices": null,
  "createdAt": "2026-04-28T12:00:00.000Z"
}
```

## Coupon Categories — `/api/v1/coupon-category`

Categorías del servicio externo asociadas a un cupón. Aplica cuando `appliesTo = "categories"`.

| Method | Path | Descripción |
|--------|------|-------------|
| `GET` | `/coupon-category` | Listar todas |
| `GET` | `/coupon-category/:id` | Obtener por UUID |
| `GET` | `/coupon-category/coupon/:couponId` | Categorías de un cupón |
| `POST` | `/coupon-category` | Asociar categoría |
| `DELETE` | `/coupon-category/:id` | Desasociar |

### Create DTO

```json
{
  "couponId": "550e8400-e29b-41d4-a716-446655440000",
  "externalCategoryId": "cat-uuid-externo",
  "externalCategoryName": "Vuelos Nacionales"
}
```

| Campo | Tipo | Requerido |
|-------|------|:---------:|
| `couponId` | `uuid` | ✅ |
| `externalCategoryId` | `uuid` | ✅ |
| `externalCategoryName` | `string` | ✅ |

### Response DTO

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440020",
  "couponId": "550e8400-e29b-41d4-a716-446655440000",
  "externalCategoryId": "cat-uuid-externo",
  "externalCategoryName": "Vuelos Nacionales"
}
```

---

## Coupon Products — `/api/v1/coupon-product`

Productos del servicio externo asociados a un cupón. Aplica cuando `appliesTo = "products"`.

| Method | Path | Descripción |
|--------|------|-------------|
| `GET` | `/coupon-product` | Listar todos |
| `GET` | `/coupon-product/:id` | Obtener por UUID |
| `GET` | `/coupon-product/coupon/:couponId` | Productos de un cupón |
| `POST` | `/coupon-product` | Asociar producto |
| `DELETE` | `/coupon-product/:id` | Desasociar |

### Create DTO

```json
{
  "couponId": "550e8400-e29b-41d4-a716-446655440000",
  "externalProductId": "prod-uuid-externo",
  "externalProductName": "Pack Hotel + Vuelo Madrid"
}
```

| Campo | Tipo | Requerido |
|-------|------|:---------:|
| `couponId` | `uuid` | ✅ |
| `externalProductId` | `uuid` | ✅ |
| `externalProductName` | `string` | ✅ |

### Response DTO

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440030",
  "couponId": "550e8400-e29b-41d4-a716-446655440000",
  "externalProductId": "prod-uuid-externo",
  "externalProductName": "Pack Hotel + Vuelo Madrid"
}
```

---

## Coupon Influencers — `/api/v1/coupon-influencer`

Asignación de influencers a cupones. La combinación `(couponId, influencerId)` es única.

| Method | Path | Descripción |
|--------|------|-------------|
| `GET` | `/coupon-influencer` | Listar todas |
| `GET` | `/coupon-influencer/:id` | Obtener por UUID |
| `GET` | `/coupon-influencer/coupon/:couponId` | Influencers de un cupón |
| `GET` | `/coupon-influencer/influencer/:influencerId` | Cupones de un influencer |
| `POST` | `/coupon-influencer` | Asignar |
| `DELETE` | `/coupon-influencer/:id` | Desasignar |

### Create DTO

```json
{
  "couponId": "550e8400-e29b-41d4-a716-446655440000",
  "influencerId": "550e8400-e29b-41d4-a716-446655440001",
  "customCommissionRate": 15.00
}
```

| Campo | Tipo | Requerido | Notas |
|-------|------|:---------:|-------|
| `couponId` | `uuid` | ✅ | |
| `influencerId` | `uuid` | ✅ | |
| `customCommissionRate` | `number \| null` | — | `null` = usa la comisión del influencer |

### Response DTO

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440040",
  "couponId": "550e8400-e29b-41d4-a716-446655440000",
  "influencerId": "550e8400-e29b-41d4-a716-446655440001",
  "customCommissionRate": 15.00,
  "assignedAt": "2026-04-28T12:00:00.000Z"
}
```

---

## Coupon Usages — `/api/v1/coupon-usage`

Registro inmutable de cada uso de un cupón. Sin update ni delete.

| Method | Path | Descripción |
|--------|------|-------------|
| `GET` | `/coupon-usage` | Listar todos |
| `GET` | `/coupon-usage/:id` | Obtener por UUID |
| `GET` | `/coupon-usage/coupon/:couponId` | Usos de un cupón |
| `GET` | `/coupon-usage/influencer/:influencerId` | Usos por influencer |
| `GET` | `/coupon-usage/user/:userId` | Usos por usuario externo |
| `POST` | `/coupon-usage` | Registrar uso |

### Create DTO

```json
{
  "couponId": "550e8400-e29b-41d4-a716-446655440000",
  "externalOrderId": "order-uuid-externo",
  "externalOrderRef": "ORD-2026-001",
  "externalUserId": "user-uuid-externo",
  "externalUserName": "Juan Pérez",
  "discountApplied": 25.00,
  "orderTotal": 175.00,
  "influencerId": "550e8400-e29b-41d4-a716-446655440001"
}
```

| Campo | Tipo | Requerido | Notas |
|-------|------|:---------:|-------|
| `couponId` | `uuid` | ✅ | |
| `externalOrderId` | `uuid` | ✅ | ID de orden en el servicio externo |
| `externalOrderRef` | `string` | ✅ | Referencia legible de la orden |
| `externalUserId` | `uuid` | ✅ | ID de usuario en el servicio externo |
| `externalUserName` | `string` | ✅ | Nombre del usuario |
| `discountApplied` | `number` | ✅ | Monto descontado |
| `orderTotal` | `number` | ✅ | Total de la orden |
| `influencerId` | `uuid \| null` | — | Influencer que refirió el uso |

### Response DTO

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440050",
  "couponId": "550e8400-e29b-41d4-a716-446655440000",
  "influencerId": "550e8400-e29b-41d4-a716-446655440001",
  "externalOrderId": "order-uuid-externo",
  "externalOrderRef": "ORD-2026-001",
  "externalUserId": "user-uuid-externo",
  "externalUserName": "Juan Pérez",
  "discountApplied": 25.00,
  "orderTotal": 175.00,
  "usedAt": "2026-04-28T12:00:00.000Z"
}
```

---

## Discount Rules — `/api/v1/discount-rule`

Reglas de validación asociadas a un descuento. Se evalúan en orden de prioridad al momento del `check` o `redeem`. **Todas las reglas deben cumplirse** para que el descuento sea válido.

| Method | Path | Descripción |
|--------|------|-------------|
| `GET` | `/discount-rule` | Listar todas |
| `GET` | `/discount-rule/:id` | Obtener por UUID |
| `GET` | `/discount-rule/discount/:discountId` | Reglas de un descuento |
| `POST` | `/discount-rule` | Crear regla |
| `PUT` | `/discount-rule/:id` | Actualizar |
| `DELETE` | `/discount-rule/:id` | Eliminar |

### Create DTO

```json
{
  "discountId": "uuid-del-descuento",
  "name": "Solo 1 pasajero",
  "conditionOperator": "AND",
  "action": "enable",
  "priority": 1,
  "field": "passengers",
  "value": "1"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|:---------:|-------------|
| `discountId` | `uuid` | ✅ | Descuento al que pertenece la regla |
| `name` | `string` | ✅ | Nombre descriptivo |
| `conditionOperator` | `string` | ✅ | `AND` — todas las condiciones deben pasar; `OR` — basta con una |
| `action` | `string` | ✅ | `enable` \| `disable` (campo de referencia; la evaluación no depende de él) |
| `priority` | `number` | — | Orden de evaluación ascendente. Default `1` |
| `field` | `string \| null` | — | Campo del contexto de la solicitud a evaluar |
| `value` | `string \| null` | — | Valor esperado para ese campo |

### Response DTO

```json
{
  "id": "uuid-regla",
  "discountId": "uuid-del-descuento",
  "name": "Solo 1 pasajero",
  "conditionOperator": "AND",
  "priority": 1,
  "action": "enable",
  "field": "passengers",
  "value": "1",
  "createdAt": "2026-04-28T12:00:00.000Z"
}
```

---

### Lógica de evaluación

Las reglas se evalúan en orden de prioridad. Si alguna no se cumple, el descuento se rechaza con el motivo.

#### Caso 1 — Regla con `field` + `value` (sin condiciones)

Pasa si `ctx[field] === value` (comparación de strings), **excepto para `passengers`**: cuando el campo es `passengers`, se evalúa como múltiplo — pasa si `passengers % value === 0`.

```json
{ "field": "passengers", "value": "2" }
```
→ válido si `passengers` es múltiplo de 2: **2, 4, 6, 8, …**

#### Caso 2 — Regla con `field` sin `value` (sin condiciones)

Pasa si el campo existe y no es `null`.

```json
{ "field": "passengers", "value": null }
```
→ válido si `passengers` está presente con cualquier valor

#### Caso 3 — Regla con condiciones (`rule_conditions`)

Las condiciones se evalúan usando `conditionOperator`:
- `AND`: todas deben pasar
- `OR`: al menos una debe pasar

El campo usado para cada condición es `rule.field` si está definido; de lo contrario, `condition.field`.

#### Caso 4 — Regla sin `field` y sin condiciones

Siempre pasa (sin restricción).

---

### Campos disponibles en el contexto de evaluación

| Campo | Tipo | Disponible en |
|-------|------|---------------|
| `days` | `number` | check + redeem |
| `amount` | `number` | check + redeem |
| `service_id` | `number` | check + redeem |
| `office_id` | `number` | check + redeem |
| `origen` | `string` | check + redeem |
| `destino` | `string` | check + redeem |
| `passengers` | `number` | solo check |
| `polizas` | `number[]` | solo redeem |
| `count` | `number` | check (`passengers`) / redeem (`polizas.length`) |

> `days` se calcula como `fecha_final - fecha_inicio + 1` (ambos días inclusive).

---

### Ejemplos de uso

**Aplicar descuento para múltiplos de 2 pasajeros (2, 4, 6, …):**
```json
{
  "discountId": "...",
  "name": "Múltiplos de 2 pasajeros",
  "conditionOperator": "AND",
  "action": "enable",
  "priority": 1,
  "field": "passengers",
  "value": "2"
}
```
> Con `field` + `value` en `passengers`, el motor evalúa el módulo: `passengers % 2 === 0`.

**Aplicar descuento para múltiplos de 2 pasajeros (vía condición explícita):**
```json
{
  "discountId": "...",
  "name": "Múltiplos de 2 pasajeros",
  "conditionOperator": "AND",
  "action": "enable",
  "priority": 1
}
```
+ condición con `scope: "scalar"`, `field: "passengers"`, `operator: "multiple_of"`, `value: 2`

**Aplicar descuento para destinos específicos (via condiciones):**
```json
{
  "discountId": "...",
  "name": "Destinos LATAM",
  "conditionOperator": "OR",
  "action": "enable",
  "priority": 2,
  "field": "destino",
  "value": null
}
```
+ condiciones con `operator: in`, `value: ["MX","CO","PE","AR"]`

**Aplicar descuento para viajes entre 5 y 15 días:**
```json
{
  "discountId": "...",
  "name": "Duración válida",
  "conditionOperator": "AND",
  "action": "enable",
  "priority": 1,
  "field": "days",
  "value": null
}
```
+ condiciones con `operator: between`, `value: [5, 15]`

---

## Rule Conditions — `/api/v1/rule-condition`

Condiciones individuales dentro de una regla. Normalmente se crean via template; el CRUD directo permite ajustes finos.

| Method | Path | Descripción |
|--------|------|-------------|
| `GET` | `/rule-condition` | Listar todas |
| `GET` | `/rule-condition/:id` | Obtener por UUID |
| `GET` | `/rule-condition/rule/:ruleId` | Condiciones de una regla |
| `POST` | `/rule-condition` | Crear condición |
| `DELETE` | `/rule-condition/:id` | Eliminar |

### Create DTO

```json
{
  "ruleId": "uuid-regla",
  "scope": "array:all",
  "field": "beneficiarios.age",
  "operator": "gte",
  "value": 18,
  "operatorInner": null,
  "valueInner": null
}
```

| Campo | Tipo | Requerido | Notas |
|-------|------|:---------:|-------|
| `ruleId` | `uuid` | ✅ | |
| `field` | `string` | ✅ | Dot-notation; índice numérico para acceso posicional: `arr.0.campo` |
| `operator` | `Operator` | ✅ | Ver tabla de operadores |
| `value` | `any` | ✅ | JSONB — escalar, array o rango |
| `scope` | `Scope` | — | Default `scalar` |
| `operatorInner` | `Operator \| null` | — | Solo `array:count` |
| `valueInner` | `any \| null` | — | Solo `array:count` |

### Scopes

| Scope | Descripción | `value` esperado |
|-------|-------------|-----------------|
| `scalar` | Evalúa el campo directamente | escalar |
| `array:all` | Todos los elementos pasan | escalar |
| `array:any` | Al menos uno pasa | escalar |
| `array:none` | Ninguno pasa | escalar |
| `array:count` | N elementos que pasan la condición interna cumplen la condición outer | `operatorInner` + `valueInner` requeridos |
| `array:length` | La longitud del array cumple la condición | número |

### Operadores

| Operador | Descripción |
|----------|-------------|
| `eq` | Igual |
| `neq` | Distinto |
| `gt` | Mayor que |
| `gte` | Mayor o igual |
| `lt` | Menor que |
| `lte` | Menor o igual |
| `in` | Está en la lista (`value` = array) |
| `not_in` | No está en la lista (`value` = array) |
| `between` | En rango (`value` = `[min, max]`) |
| `contains` | El string contiene el substring |
| `multiple_of` | El valor es múltiplo de `value` (ej. `value: 2` → acepta 2, 4, 6, …) |

### Ejemplo `array:count`

"Al menos 2 beneficiarios tienen age >= 60":

```json
{
  "ruleId": "uuid-regla",
  "scope": "array:count",
  "field": "beneficiarios.age",
  "operator": "gte",
  "value": 2,
  "operatorInner": "gte",
  "valueInner": 60
}
```

### Response DTO

```json
{
  "id": "uuid-condicion",
  "ruleId": "uuid-regla",
  "scope": "array:all",
  "field": "beneficiarios.age",
  "operator": "gte",
  "value": 18,
  "operatorInner": null,
  "valueInner": null,
  "createdAt": "2026-04-28T12:00:00.000Z"
}
```

---

## Multiviajes — `/api/v1/multiviaje`

Planes de viaje con precio base y descuento. El `precioFinal` se calcula automáticamente en la respuesta como `costoBase - descuento`.

| Method | Path | Descripción |
|--------|------|-------------|
| `GET` | `/multiviaje` | Listar todos |
| `GET` | `/multiviaje/:id` | Obtener por UUID |
| `GET` | `/multiviaje/servicio/:servicioId` | Planes de un servicio |
| `POST` | `/multiviaje` | Crear |
| `PUT` | `/multiviaje/:id` | Actualizar |
| `DELETE` | `/multiviaje/:id` | Eliminar |

### Create DTO

```json
{
  "servicioId": 5,
  "dias": 10,
  "costoBase": 850.00,
  "descuento": 50.00,
  "nombre": "Pack Europa 10 días",
  "descripcion": "Incluye seguro médico y asistencia 24h"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|:---------:|-------------|
| `servicioId` | `number` | ✅ | ID del servicio externo |
| `dias` | `number` | ✅ | Duración del plan en días |
| `costoBase` | `number` | ✅ | Precio sin descuento |
| `descuento` | `number` | — | Monto fijo de descuento. Default `0` |
| `nombre` | `string` | ✅ | Nombre del plan |
| `descripcion` | `string \| null` | — | Descripción opcional |

### Response DTO

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440060",
  "servicioId": 5,
  "dias": 10,
  "costoBase": 850.00,
  "descuento": 50.00,
  "precioFinal": 800.00,
  "nombre": "Pack Europa 10 días",
  "descripcion": "Incluye seguro médico y asistencia 24h",
  "createdAt": "2026-05-02T12:00:00.000Z"
}
```

> `precioFinal = costoBase - descuento`

---

## Errores comunes

| Status | Body | Causa |
|--------|------|-------|
| `400` | `{ "error": "<field> is required" }` | Campo obligatorio faltante |
| `404` | `{ "error": "Not Found" }` | Recurso no encontrado |
| `204` | — | Delete exitoso |

---

## Flujo típico de uso

```
1. POST /coupon                 → crear el cupón base (opcional)
2. POST /discount               → definir tipo y valor del descuento
3. POST /discount-rule          → crear reglas de validación para el descuento
4. POST /rule-condition         → (opcional) agregar condiciones detalladas a cada regla
5. POST /coupon-category        → (si appliesTo = "categories") asociar categorías
6. POST /coupon-product         → (si appliesTo = "products") asociar productos
7. POST /influencer             → registrar influencer
8. POST /coupon-influencer      → asignar influencer al cupón
9. POST /redeem/check           → verificar si el descuento aplica antes de confirmar
10. POST /redeem                → confirmar y registrar la aplicación del descuento
```

### Ejemplo de check + redeem

**Check (antes de confirmar):**
```json
POST /api/v1/redeem/check
{
  "fecha_inicio": "2026-06-01",
  "fecha_final": "2026-06-10",
  "origen": "ES",
  "destino": "MX",
  "passengers": 2,
  "service_id": 5,
  "amount": 500,
  "discount_id": "uuid-del-descuento"
}
```

**Redeem (confirmar):**
```json
POST /api/v1/redeem
{
  "fecha_inicio": "2026-06-01",
  "fecha_final": "2026-06-10",
  "origen": "ES",
  "destino": "MX",
  "polizas": [1001, 1002],
  "service_id": 5,
  "amount": 500,
  "discount_id": "uuid-del-descuento"
}
```
