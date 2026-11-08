const MEDIA_BASE = 'https://media.navinhill.com';

export interface NavinHillTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumId: string;
  trackNumber: number;
  src: string;
}

export interface NavinHillAlbum {
  id: string;
  title: string;
  cover: string;
  tracks: NavinHillTrack[];
}

type TrackSeed = [title: string, file: string];

const makeAlbum = (
  id: string,
  title: string,
  coverFile: string,
  seeds: TrackSeed[]
): NavinHillAlbum => ({
  id,
  title,
  cover: `${MEDIA_BASE}/images/albums/${coverFile}`,
  tracks: seeds.map(([trackTitle, file], index) => ({
    id: `${id}-${index + 1}`,
    title: trackTitle,
    artist: 'Navin Hill',
    album: title,
    albumId: id,
    trackNumber: index + 1,
    src: `${MEDIA_BASE}/converted_audio/${id}/${file}`,
  })),
});

/**
 * Playlist order mirrors navinhill.com's homepage: Martians is the featured
 * album and full tracklist there, followed by the three album covers that
 * appear on the homepage (Symphonies → Reprisals → Elevation).
 */
export const NAVIN_HILL_ALBUMS: NavinHillAlbum[] = [
  makeAlbum('martians', 'Martians', 'MARTIANS.png', [
    ['Sunday Service', 'Sunday%20Service.mp3'],
    ['Seasons', 'Seasons.mp3'],
    ['Summer Love', 'Summer%20Love.mp3'],
    ['Elixir', 'Elixir.mp3'],
    ['Lavender', 'Lavender.mp3'],
    ['Paris', 'Paris.mp3'],
    ['Becoming', 'Becoming.mp3'],
    ['Driveways', 'Driveways.mp3'],
    ['Rainstorms', 'Rainstorms.mp3'],
    ['Impressions', 'Impressions.mp3'],
    ["C'est la Vie", 'C_est%20la%20Vie.mp3'],
    ['Sprung', 'Sprung.mp3'],
    ['The Calling', 'The%20Calling.mp3'],
    ['Glory', 'Glory.mp3'],
  ]),
  makeAlbum('symphonies', 'Symphonies', 'SYMPHONIES.png', [
    ['Doorsteps', 'Doorsteps.mp3'],
    ['Oasis', 'Oasiss.mp3'],
    ['Luna', 'Luna.mp3'],
    ['Fields of Lavender', 'Fields%20of%20Lavender.mp3'],
    ['Black Rose', 'Black%20Rose.mp3'],
    ['Boundless', 'Boundless.mp3'],
    ['Sand Dunes', 'Sand%20Dunes.mp3'],
    ['Iliad', 'Iliad.mp3'],
    ['Eternal', 'Eternal.mp3'],
    ['Willows', 'Willows.mp3'],
    ['After the Rain', 'After%20the%20Rain.mp3'],
  ]),
  makeAlbum('reprisal', 'Reprisals', 'REPRISALS.png', [
    ['Pathways', 'Pathways.mp3'],
    ['Departures', 'Departures.mp3'],
    ['Swayze', 'Swayze.mp3'],
    ['Barbershop', 'Barbershop.mp3'],
    ['The Genie', 'Witness.mp3'],
    ['Take Ya Chance', 'Take%20Ya%20Chance.mp3'],
    ['Down Bad', 'Down%20Bad.mp3'],
    ['Street Lights', 'Street%20Lights.mp3'],
    ['Synth Love', 'Synth%20Love.mp3'],
    ['Following', 'Following.mp3'],
  ]),
  makeAlbum('elevation', 'Elevation', 'ELEVATION.png', [
    ['Evergreen', 'Evergreen.mp3'],
    ['Floating (D minor)', 'Floating%20(D%20minor).mp3'],
    ['Daybreak', 'Daybreak.mp3'],
    ['Neon Lights', 'Neon%20Lights.mp3'],
    ['Sirens', 'Sirens.mp3'],
    ['Tides', 'Tides.mp3'],
    ['Weightless', 'Weightless.mp3'],
    ['Floating (G major)', 'Floating%20(G%20major).mp3'],
  ]),
];

export const NAVIN_HILL_TRACKS: NavinHillTrack[] = NAVIN_HILL_ALBUMS.flatMap(
  (album) => album.tracks
);
