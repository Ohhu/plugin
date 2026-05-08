import { PAGE_SIZE } from './constants';
import {
  mapSongArtists,
  mapSongToAlbumItem,
  mapSongToMusicItem,
  requestProxy,
  sortBySimilarity,
  uniqueById
} from './utils';
import { AlbumDetailData, AlbumInfo, SearchSongsData } from './types';

async function searchRawSongs(query: string, page: number, pageSize = PAGE_SIZE) {
  const data = await requestProxy<SearchSongsData>('/search/songs', {
    q: query,
    page,
    page_size: pageSize
  });

  return data?.items || [];
}

export const searchAlbum = async function (
  query: string,
  page: number
): Promise<IPlugin.ISearchResult<'album'>> {
  try {
    const songs = await searchRawSongs(query, page);
    const albums = uniqueById(songs
      .map(mapSongToAlbumItem)
      .filter(Boolean) as IAlbum.IAlbumItem[]);

    return {
      isEnd: true,
      data: sortBySimilarity(albums, query, (album) => album.title)
    };
  } catch (e) {
    console.error("Search album error:", e);
    return { isEnd: true, data: [] };
  }
};

export const searchArtist = async function (
  query: string,
  page: number
): Promise<IPlugin.ISearchResult<'artist'>> {
  try {
    const songs = await searchRawSongs(query, page);
    const artists = uniqueById<IArtist.IArtistItem>(
      ([] as IArtist.IArtistItem[]).concat(...songs.map(mapSongArtists))
    );

    return {
      isEnd: true,
      data: sortBySimilarity(artists, query, (artist) => artist.name, true)
    };
  } catch (e) {
    console.error("Search artist error:", e);
    return { isEnd: true, data: [] };
  }
};

export const getAlbumInfo = async function (
  albumItem: IAlbum.IAlbumItem,
  page: number
): Promise<IPlugin.IAlbumInfoResult> {
  try {
    const album = await requestProxy<AlbumDetailData>(
      `/albums/${encodeURIComponent(String(albumItem.id))}`
    );
    const songs = album?.songs || [];

    return {
      isEnd: true,
      albumItem: album ? {
        title: album.title || album.name || albumItem.title,
        artwork: album.cover || album.picUrl || albumItem.artwork,
        qqmusicRaw: album
      } : undefined,
      musicList: songs.map(mapSongToMusicItem)
    };
  } catch (e) {
    console.error("Get album info error:", e);
    return { isEnd: true, musicList: [] };
  }
};

export const getArtistWorks: IPlugin.IGetArtistWorksFunc = async function <T extends IArtist.ArtistMediaType>(
  artistItem: IArtist.IArtistItem,
  page: number,
  type: T
): Promise<IPlugin.ISearchResult<T>> {
  try {
    const artistName = artistItem.name;
    const songs = await searchRawSongs(artistName, page, 50);
    const matchedSongs = songs.filter((song) => song.artist?.includes(artistName));

    if (type === "album") {
      const albums = uniqueById(matchedSongs
        .map(mapSongToAlbumItem)
        .filter(Boolean) as AlbumInfo[]);

      return {
        isEnd: true,
        data: albums
      } as any;
    }

    return {
      isEnd: true,
      data: matchedSongs.map(mapSongToMusicItem)
    } as any;
  } catch (e) {
    console.error("Get artist works error:", e);
    return { isEnd: true, data: [] } as any;
  }
};
