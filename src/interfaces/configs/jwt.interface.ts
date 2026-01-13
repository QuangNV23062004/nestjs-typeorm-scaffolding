export interface JwtConfig {
  publicAccessKey: string;
  privateAccessKey: string;
  accessExpiresIn: string;
  publicRefreshKey: string;
  privateRefreshKey: string;
  refreshExpiresIn: string;
}
