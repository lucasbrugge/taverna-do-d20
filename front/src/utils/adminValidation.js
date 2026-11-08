/** Validadores da interface; Laravel Form Requests ainda validam tudo no servidor. */
export function validateCategory(data) {
  const name = String(data.name ?? '').trim();
  const slug = String(data.slug ?? '').trim().toLowerCase();
  const errors = {};

  if (!name || name.length > 255) errors.name = 'Informe um nome de até 255 caracteres.';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 255) {
    errors.slug = 'Use letras minúsculas, números e hífens, sem espaços.';
  }

  return { valid: Object.keys(errors).length === 0, errors, data: { name, slug } };
}

export function validateProduct(data, file = null) {
  const errors = {};
  const name = String(data.name ?? '').trim();
  const description = String(data.description ?? '').trim();
  const price = String(data.price ?? '').trim().replace(',', '.');
  const stock = String(data.stock ?? '').trim();
  const categoryId = Number(data.category_id);
  const isActive = String(data.is_active ?? '');

  if (!Number.isSafeInteger(categoryId) || categoryId < 1) {
    errors.category_id = 'Selecione uma categoria válida.';
  }
  if (!name || name.length > 255) errors.name = 'Informe um nome de até 255 caracteres.';
  if (!description || description.length > 10_000) {
    errors.description = 'Informe uma descrição de até 10.000 caracteres.';
  }
  // Somente dígitos e, no máximo, duas casas decimais. Não usamos float nos cálculos.
  if (!/^\d+(?:\.\d{1,2})?$/.test(price)) {
    errors.price = 'Informe um preço válido com até duas casas decimais.';
  } else {
    const [whole, fraction = '0'] = price.split('.');
    const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
    if (cents < 1n || cents > 9_999_999_999n) {
      errors.price = 'O preço deve ser de R$ 0,01 até R$ 99.999.999,99.';
    }
  }
  if (!/^\d+$/.test(stock) || !Number.isSafeInteger(Number(stock)) || Number(stock) > 4294967295) {
    errors.stock = 'O estoque deve ser um número inteiro maior ou igual a zero.';
  }
  if (!['0', '1'].includes(isActive)) errors.is_active = 'Selecione o estado do produto.';

  if (file && file.size > 0) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      errors.image = 'Use JPG, PNG ou WebP.';
    } else if (file.size > 2 * 1024 * 1024) {
      errors.image = 'A imagem deve ter até 2 MiB.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: { ...data, name, description, price, stock, category_id: String(categoryId), is_active: isActive },
  };
}
