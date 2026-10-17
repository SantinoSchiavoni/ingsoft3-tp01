variable "image_repo_api" {
  type        = string
  default     = "ghcr.io/santinoschiavoni/ingsoft3-tp01-backend"
  description = "Repositorio de la imagen de backend en GHCR (sin etiqueta)"
}

variable "image_repo_front" {
  type        = string
  default     = "ghcr.io/santinoschiavoni/ingsoft3-tp01-frontend"
  description = "Repositorio de la imagen de frontend en GHCR (sin etiqueta)"
}

variable "image_tag" {
  type        = string
  default     = "sha-ac4a1e0b737587cd81c442a12c4b3ad76f53cfae"
  description = "Etiqueta inmutable sha-<commit> generada en el merge del TP7 (v7.0.0)"
}

variable "region" {
  type        = string
  default     = "oregon"
  description = "Región de despliegue en Render (frankfurt | ohio | oregon | singapore | virginia)"
}
