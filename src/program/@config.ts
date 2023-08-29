import {existsSync} from 'fs';
import {resolve} from 'path';
import {pathToFileURL} from 'url';

import {ProgramError} from 'main-function';
import * as x from 'x-value';

import {CONFIG_FILE_NAME_DEFAULT} from './@constants';

export const ServerConfig = x.object({
  type: x.literal('server'),
  name: x.string.optional(),
  host: x.string.optional(),
  port: x.number.optional(),
  action: x.function([x.string], x.Promise(x.void)),
});

export type ServerConfig = x.TypeOf<typeof ServerConfig>;

export const ClientConfig = x.object({
  type: x.literal('client'),
  name: x.string,
  host: x.string,
  port: x.number.optional(),
});

export type ClientConfig = x.TypeOf<typeof ClientConfig>;

export const Config = x.union([ServerConfig, ClientConfig]);

export type Config = x.TypeOf<typeof Config>;

const CONFIG_EXTENSIONS = ['', '.js', '.mjs', '.cjs', '.json'];

export async function getConfig(
  configFileName = CONFIG_FILE_NAME_DEFAULT,
): Promise<Config> {
  const pathBase = resolve(configFileName);

  const path = CONFIG_EXTENSIONS.map(extension => pathBase + extension).find(
    path => existsSync(path),
  );

  if (path === undefined) {
    throw new ProgramError(1, `Config file not found: ${configFileName}`);
  }

  let config: Config;

  try {
    config = require(path);
  } catch {
    config = (await import(pathToFileURL(path).href)).default;
  }

  return Config.sanitize(config);
}
