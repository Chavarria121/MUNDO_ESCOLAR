import { SetMetadata } from '@nestjs/common';
import { Permiso } from '../permisos.constants';

export const PERMISOS_KEY = 'permisos_requeridos';

/** Declara qué permiso(s) de la tabla Permiso exige un endpoint. */
export const RequierePermisos = (...permisos: Permiso[]) => SetMetadata(PERMISOS_KEY, permisos);
