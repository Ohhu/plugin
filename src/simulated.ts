import { BASE_URL, PAGE_SIZE } from './constants';
import { requestWithRetry, buildApiUrl, sortBySimilarity } from './utils';
import { ApiResponse, AggregateSearchData, AlbumInfo } from './types';

/**
 * 模拟功能 (使用搜索 API 模拟)
 * 包括: 专辑搜索、专辑详情、艺术家作品
 *
 * 注意: 由于 TuneHub API 不提供 albumId 和 artistId,
 * 这些功能通过搜索 API 模拟实现,可能存在数据不准确的情况
 */

// 专辑搜索
export const searchAlbum = async function (
  query: string,
  page: number
): Promise<IPlugin.ISearchResult<'album'>> {
  try {
    const data = await requestWithRetry<ApiResponse<AggregateSearchData>>({
      method: 'GET',
      url: `${BASE_URL}/api/`,
      params: {
        type: "aggregateSearch",
        keyword: query
      }
    });

    if (data.code === 200) {
      const results = data.data.results || [];

      // 从歌曲结果中提取专辑信息(去重)
      const albumMap = new Map<string, AlbumInfo>();
      results.forEach((item) => {
        if (item.album && !albumMap.has(item.album)) {
          albumMap.set(item.album, {
            id: item.album, // 使用专辑名作为 ID
            platform: item.platform,
            source: item.platform,
            title: item.album,
            artist: item.artist,
            artwork: buildApiUrl(BASE_URL, item.platform, item.id, 'pic'),
          });
        }
      });

      // 使用工具函数排序
      const albumList = sortBySimilarity(
        Array.from(albumMap.values()),
        query,
        (album) => album.title
      );

      // 聚合搜索返回结果较少，直接返回所有结果
      return {
        isEnd: true,
        data: albumList
      };
    }
  } catch (e) {
    console.error("Search album error:", e);
  }

  return { isEnd: true, data: [] };
};

// 获取专辑详情
export const getAlbumInfo = async function (
  albumItem: IAlbum.IAlbumItem,
  page: number
): Promise<IPlugin.IAlbumInfoResult> {
  const platform = (albumItem as any).source || "netease";
  const albumName = albumItem.title;
  const artistName = albumItem.artist;

  try {
    // 使用艺术家名 + 专辑名进行精确搜索
    const searchKeyword = artistName ? `${artistName} ${albumName}` : albumName;

    const data = await requestWithRetry<ApiResponse<AggregateSearchData>>({
      method: 'GET',
      url: `${BASE_URL}/api/`,
      params: {
        source: platform,
        type: "search",
        keyword: searchKeyword,
        limit: 100
      }
    });

    if (data.code === 200) {
      const results = data.data.results || [];

      // 过滤出匹配的歌曲
      const musicList = results
        .filter((item) => {
          // 专辑名必须匹配
          const albumMatch = item.album && item.album.toLowerCase().includes(albumName.toLowerCase());
          // 如果有艺术家信息,艺术家名也要匹配
          const artistMatch = !artistName || (item.artist && item.artist.toLowerCase().includes(artistName.toLowerCase()));
          return albumMatch && artistMatch;
        })
        .map((item) => ({
          id: item.id,
          platform: platform,
          source: platform,
          title: item.name,
          artist: item.artist,
          album: item.album,
          artwork: buildApiUrl(BASE_URL, platform, item.id, 'pic'),
          url: buildApiUrl(BASE_URL, platform, item.id, 'url', '320k')
        }));

      return {
        isEnd: true,
        musicList
      };
    }
  } catch (e) {
    console.error("Get album info error:", e);
  }

  return {
    isEnd: true,
    musicList: []
  };
};

// 获取艺术家作品
export const getArtistWorks: IPlugin.IGetArtistWorksFunc = async function <T extends IArtist.ArtistMediaType>(
  artistItem: IArtist.IArtistItem,
  page: number,
  type: T
): Promise<IPlugin.ISearchResult<T>> {
  const platform = (artistItem as any).source || "netease";
  const artistName = artistItem.name;

  try {
    // 使用搜索 API 搜索艺术家名称
    const data = await requestWithRetry<ApiResponse<AggregateSearchData>>({
      method: 'GET',
      url: `${BASE_URL}/api/`,
      params: {
        source: platform,
        type: "search",
        keyword: artistName,
        limit: 50
      }
    });

    if (data.code === 200) {
      const results = data.data.results || [];

      if (type === "music") {
        // 返回歌曲列表
        const musicList = results
          .filter((item) => item.artist && item.artist.includes(artistName))
          .map((item) => ({
            id: item.id,
            platform: platform,
            source: platform,
            title: item.name,
            artist: item.artist,
            album: item.album,
            artwork: buildApiUrl(BASE_URL, platform, item.id, 'pic'),
            url: buildApiUrl(BASE_URL, platform, item.id, 'url', '320k')
          }));

        return {
          isEnd: true,
          data: musicList
        } as any;
      } else if (type === "album") {
        // 返回专辑列表(去重)
        const albumMap = new Map<string, AlbumInfo>();
        results
          .filter((item) => item.artist && item.artist.includes(artistName))
          .forEach((item) => {
            if (item.album && !albumMap.has(item.album)) {
              albumMap.set(item.album, {
                id: item.album, // 使用专辑名称作为 ID
                platform: platform,
                source: platform,
                title: item.album,
                artist: item.artist,
                artwork: buildApiUrl(BASE_URL, platform, item.id, 'pic')
              });
            }
          });

        return {
          isEnd: true,
          data: Array.from(albumMap.values())
        } as any;
      }
    }
  } catch (e) {
    console.error("Get artist works error:", e);
  }

  return {
    isEnd: true,
    data: []
  } as any;
};
