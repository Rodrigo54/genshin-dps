import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { type Catalog, type TeamMember } from '@genshin-dps/schema/site-data';
import { provideTranslocoForTests } from '../../testing/transloco-testing';
import { TeamMembers } from './team-members';

const catalog: Catalog = {
  characters: {
    mavuika: {
      id: 'mavuika',
      name: { pt: 'Mavuika', en: 'Mavuika' },
      rarity: 5,
      element: 'pyro',
      icon: 'UI_AvatarIcon_Mavuika',
    },
    bennett: {
      id: 'bennett',
      name: { pt: 'Bennett', en: 'Bennett' },
      rarity: 4,
      element: 'pyro',
      icon: 'UI_AvatarIcon_Bennett',
    },
  },
  weapons: {
    'wolf-fang': {
      id: 'wolf-fang',
      name: { pt: 'Farpa', en: 'Wolf-Fang' },
      rarity: 4,
      icon: 'UI_EquipIcon_Sword_Boreas',
    },
  },
  artifactSets: {},
};

const members: TeamMember[] = [
  {
    characterId: 'mavuika',
    element: 'pyro',
    constellation: 1,
    level: 90,
    weapon: { weaponId: 'wolf-fang', refinement: 5 },
  },
  { characterId: 'bennett', element: 'pyro', constellation: 6, level: 90 },
];

async function render(locale: 'pt' | 'en') {
  TestBed.configureTestingModule({ imports: [TeamMembers, provideTranslocoForTests()] });
  TestBed.inject(TranslocoService).setActiveLang(locale);
  const fixture = TestBed.createComponent(TeamMembers);
  fixture.componentRef.setInput('members', members);
  fixture.componentRef.setInput('catalog', catalog);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('TeamMembers', () => {
  it('mostra constelação, refinamento e o ícone servido pelo site', async () => {
    const element = await render('pt');
    const items = element.querySelectorAll('li');
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain('C1');
    expect(items[0].textContent).toContain('R5');
    expect(items[0].querySelector('img')?.getAttribute('src')).toBe('/images/UI_AvatarIcon_Mavuika.webp');
  });

  it('pinta o selo da arma na cor da raridade dela', async () => {
    const element = await render('pt');
    const weaponBadge = element.querySelectorAll('li')[0]!.querySelector('[tabindex="0"]:has(img[src*="EquipIcon"])');
    expect(weaponBadge?.classList).toContain('bg-rarity-4');
  });

  it('junta constelação e elemento num selo na cor do elemento', async () => {
    const element = await render('pt');
    const badge = element.querySelectorAll('li')[0]!.querySelector('span:has(> img[src*="UI_Buff_Element"])');
    expect(badge?.textContent?.trim()).toBe('C1');
    expect(badge?.classList).toContain('text-pyro');
  });

  it('mostra o ícone do elemento do personagem', async () => {
    const element = await render('pt');
    const icons = [...element.querySelectorAll('li')[0]!.querySelectorAll('img')].map((img) => img.getAttribute('src'));
    expect(icons).toContain('/images/UI_Buff_Element_Fire.webp');
  });

  it('descreve cada membro no idioma pedido para leitores de tela', async () => {
    const element = await render('en');
    expect(element.querySelector('.sr-only')?.textContent).toBe('Mavuika C1 with Wolf-Fang R5');
  });

  it('mostra suporte sem arma informada, sem ícone nem refinamento', async () => {
    const element = await render('pt');
    const bennett = element.querySelectorAll('li')[1]!;
    expect(bennett.querySelector('.sr-only')?.textContent).toBe('Bennett C6 com arma não informada');
    expect(bennett.querySelector('img[src*="EquipIcon"]')).toBeNull();
    expect(bennett.textContent).not.toContain('R');
  });
});
