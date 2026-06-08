/**
 * Utilitários para máscaras de input no front-end
 */

export const maskPhone = (value: string) => {
  if (!value) return ""
  value = value.replace(/[^0-9*]/g, "")
  value = value.replace(/^([\d*]{2})([\d*])/g, "($1) $2")
  value = value.replace(/([\d*])([\d*]{4})$/, "$1-$2")
  return value.substring(0, 15) // (99) 99999-9999
}

export const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1")
}

export const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1")
}

export const maskDocument = (val: string) => {
  const digits = val.replace(/[^0-9*]/g, "");
  if (digits.length <= 11) {
    return digits
      .replace(/([\d*]{3})([\d*])/, "$1.$2")
      .replace(/([\d*]{3})([\d*])/, "$1.$2")
      .replace(/([\d*]{3})([\d*]{1,2})/, "$1-$2")
      .substring(0, 14);
  }
  return digits
    .replace(/([\d*]{2})([\d*])/, "$1.$2")
    .replace(/([\d*]{3})([\d*])/, "$1.$2")
    .replace(/([\d*]{3})([\d*])/, "$1/$2")
    .replace(/([\d*]{4})([\d*]{1,2})/, "$1-$2")
    .substring(0, 18);
}

export const maskCEP = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .substring(0, 9)
}

export const unmask = (value: string) => {
  return value.replace(/\D/g, "")
}
