import { BASE_URL, PAGE_SIZE } from './constants';
import { requestWithRetry, sortBySimilarity, getMethodConfig, executeMethodConfig } from './utils';
import { ApiResponse, ParseRequest, ParseResponseData, AlbumInfo } from './types';

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
  const platforms = ["netease", "qq", "kuwo"];
  const albumMap = new Map<string, AlbumInfo>();

  for (const platform of platforms) {
    try {
      const config = await getMethodConfig(BASE_URL, platform, 'search');
      if (!config) continue;

      const data = await executeMethodConfig(config, {
        keyword: query,
        page: String(page),
        limit: String(PAGE_SIZE)
      });

      // transform 函数直接返回数组
      if (data && Array.isArray(data)) {
        // 从歌曲结果中提取专辑信息(去重)
        data.forEach((item: any) => {
          const albumName = item.album || "";
          if (albumName && !albumMap.has(albumName)) {
            albumMap.set(albumName, {
              id: albumName, // 使用专辑名作为 ID
              platform: platform,
              source: platform,
              title: albumName,
              artist: item.artist || "",
              artwork: item.pic || ""
            });
          }
        });
      }
    } catch (e) {
      console.error(`Search album error for ${platform}:`, e);
    }
  }

  // 使用工具函数排序
  const albumList = sortBySimilarity(
    Array.from(albumMap.values()),
    query,
    (album) => album.title
  );

  return {
    isEnd: true,
    data: albumList
  };
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

    const config = await getMethodConfig(BASE_URL, platform, 'search');
    if (!config) {
      return { isEnd: true, musicList: [] };
    }

    const data = await executeMethodConfig(config, {
      keyword: searchKeyword,
      page: "1",
      limit: "100"
    });

    // transform 函数直接返回数组
    if (data && Array.isArray(data)) {
      // 过滤出匹配的歌曲
      const musicList = data
        .filter((item: any) => {
          const itemAlbum = item.album || "";
          const itemArtist = item.artist || "";
          // 专辑名必须匹配
          const albumMatch = itemAlbum.toLowerCase().includes(albumName.toLowerCase());
          // 如果有艺术家信息,艺术家名也要匹配
          const artistMatch = !artistName || itemArtist.toLowerCase().includes(artistName.toLowerCase());
          return albumMatch && artistMatch;
        })
        .map((item: any) => ({
          id: item.id,
          platform: platform,
          source: platform,
          title: item.name || item.title,
          artist: item.artist || "",
          album: item.album || "",
          artwork: item.pic || "",
          url: "" // URL 将通过 getMediaSource 获取
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
    const config = await getMethodConfig(BASE_URL, platform, 'search');
    if (!config) {
      return { isEnd: true, data: [] } as any;
    }

    const data = await executeMethodConfig(config, {
      keyword: artistName,
      page: String(page),
      limit: "50"
    });

    // transform 函数直接返回数组
    if (data && Array.isArray(data)) {
      const results = data.filter((item: any) => {
        const itemArtist = item.artist || "";
        return itemArtist.includes(artistName);
      });

      if (type === "music") {
        // 返回歌曲列表
        const musicList = results.map((item: any) => ({
          id: item.id,
          platform: platform,
          source: platform,
          title: item.name || item.title,
          artist: item.artist || "",
          album: item.album || "",
          artwork: item.pic || "",
          url: "" // URL 将通过 getMediaSource 获取
        }));

        return {
          isEnd: true,
          data: musicList
        } as any;
      } else if (type === "album") {
        // 返回专辑列表(去重)
        const albumMap = new Map<string, AlbumInfo>();
        results.forEach((item: any) => {
          const albumName = item.album || "";
          if (albumName && !albumMap.has(albumName)) {
            albumMap.set(albumName, {
              id: albumName, // 使用专辑名称作为 ID
              platform: platform,
              source: platform,
              title: albumName,
              artist: item.artist || "",
              artwork: item.pic || ""
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
