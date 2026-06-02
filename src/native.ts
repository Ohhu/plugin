import { PAGE_SIZE, QUALITY_MAP } from './constants';
import {
  mapSongToMusicItem,
  requestProxy
} from './utils';
import {
  ApiSong,
  LyricData,
  PlaylistData,
  SearchSongsData,
  SongUrlData
} from './types';
import { searchAlbum, searchArtist } from './simulated';
import { extractQQMusicPlaylistId, fetchQQMusicPlaylist } from './qqmusicPlaylist';

const lyricCache = new Map<string, string>();
const MAX_CACHE_SIZE = 50;

function setLyricCache(id: string, lyric: string) {
  if (lyricCache.size >= MAX_CACHE_SIZE) {
    const firstKey = lyricCache.keys().next().value;
    if (firstKey) lyricCache.delete(firstKey);
  }
  lyricCache.set(id, lyric);
}

export async function searchSongs(
  query: string,
  page: number
): Promise<IPlugin.ISearchResult<'music'>> {
  try {
    const data = await requestProxy<SearchSongsData>('/search/songs', {
      q: query,
      page,
      page_size: PAGE_SIZE
    });

    const songs = data?.items || [];

    return {
      isEnd: !data?.hasMore,
      data: songs.map(mapSongToMusicItem)
    };
  } catch (e) {
    console.error("Search songs error:", e);
    return { isEnd: true, data: [] };
  }
}

export const search: IPlugin.ISearchFunc = async function (query, page, type) {
  if (type === "album") {
    return searchAlbum(query, page) as any;
  }

  if (type === "artist") {
    return searchArtist(query, page) as any;
  }

  if (type === "music") {
    return searchSongs(query, page) as any;
  }

  return { isEnd: true, data: [] } as any;
};

export const getMusicInfo = async function (
  musicBase: IMedia.IMediaBase
): Promise<Partial<IMusic.IMusicItem> | null> {
  try {
    const song = await requestProxy<ApiSong>(`/songs/${encodeURIComponent(String(musicBase.id))}`);
    return song ? mapSongToMusicItem(song) : null;
  } catch (e) {
    console.error("Get music info error:", e);
    return null;
  }
};

export const getMediaSource = async function (
  musicItem: IMusic.IMusicItemPartial,
  quality: IMusic.IQualityKey
): Promise<IPlugin.IMediaSourceResult | null> {
  if (!musicItem.id) {
    return null;
  }

  try {
    const data = await requestProxy<SongUrlData>(
      `/songs/${encodeURIComponent(String(musicItem.id))}/url`,
      { quality: QUALITY_MAP[quality] || QUALITY_MAP.standard }
    );
    const url = data?.audio?.url;

    if (!url) {
      return null;
    }

    return {
      url,
      quality
    };
  } catch (e) {
    console.error("Get media source error:", e);
    return null;
  }
};

export const getLyric = async function (
  musicItem: IMusic.IMusicItemPartial
): Promise<ILyric.ILyricSource | null> {
  if (!musicItem.id) {
    return { rawLrc: "" };
  }

  const cacheKey = String(musicItem.id);
  if (lyricCache.has(cacheKey)) {
    return { rawLrc: lyricCache.get(cacheKey)! };
  }

  try {
    const data = await requestProxy<LyricData>(
      `/songs/${encodeURIComponent(String(musicItem.id))}/lyric`
    );
    const rawLrc = data?.lyric?.lrc || "";

    setLyricCache(cacheKey, rawLrc);
    return { rawLrc };
  } catch (e) {
    console.error("Get lyric error:", e);
    return { rawLrc: "" };
  }
};

export async function getPlaylist(id: string): Promise<PlaylistData | null> {
  try {
    return await fetchQQMusicPlaylist(id);
  } catch (e) {
    console.error("Get playlist error:", e);
    return null;
  }
}

export const importMusicSheet = async function (
  urlLike: string
): Promise<IMusic.IMusicItem[] | null> {
  const playlistId = extractQQMusicPlaylistId(urlLike);
  if (!playlistId) {
    return null;
  }

  const playlist = await getPlaylist(playlistId);
  return playlist?.songs?.map(mapSongToMusicItem) || null;
};

export const getMusicSheetInfo = async function (
  sheetItem: IMusic.IMusicSheetItem,
  page: number
): Promise<IPlugin.ISheetInfoResult | null> {
  const playlistId = extractQQMusicPlaylistId(String(sheetItem.id)) || String(sheetItem.id);
  const playlist = await getPlaylist(playlistId);
  const songs = playlist?.songs || [];
  const start = Math.max(page - 1, 0) * PAGE_SIZE;
  const musicList = songs.slice(start, start + PAGE_SIZE).map(mapSongToMusicItem);

  return {
    isEnd: start + PAGE_SIZE >= songs.length || !playlist?.hasMore,
    sheetItem: playlist ? {
      title: playlist.title || sheetItem.title,
      description: playlist.description || sheetItem.description,
      artwork: playlist.cover || sheetItem.artwork,
      playCount: playlist.playCount,
      worksNum: playlist.songCount,
      artist: playlist.creator?.nickname
    } : undefined,
    musicList
  };
};
