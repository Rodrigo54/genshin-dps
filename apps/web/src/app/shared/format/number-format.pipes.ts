import { Pipe, type PipeTransform } from '@angular/core';
import { type Locale } from '@genshin-dps/schema/site-data';
import { formatSeconds, formatTeamDps } from './number-format';

@Pipe({ name: 'teamDps' })
export class TeamDpsPipe implements PipeTransform {
  transform(teamDps: number, locale: Locale): string {
    return formatTeamDps(teamDps, locale);
  }
}

@Pipe({ name: 'seconds' })
export class SecondsPipe implements PipeTransform {
  transform(seconds: number, locale: Locale): string {
    return formatSeconds(seconds, locale);
  }
}
