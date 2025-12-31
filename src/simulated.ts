import axios from 'axios';
import { BASE_URL } from './constants';

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
    const res = await axios.get(`${BASE_URL}/api/`, {
      params: {
        type: "aggregateSearch",
        keyword: query
      }
    });

    if (res.data.code === 200) {
      const results = res.data.data.results || [];

      // 从歌曲结果中提取专辑信息(去重)
      const albumMap = new Map();
      results.forEach((item: any) => {
        if (item.album && !albumMap.has(item.album)) {
          albumMap.set(item.album, {
            id: item.album, // 使用专辑名作为 ID
            source: item.platform,
            title: item.album,
            artist: item.artist,
            artwork: `${BASE_URL}/api/?source=${item.platform}&id=${item.id}&type=pic`,
            _searchQuery: query.toLowerCase() // 保存搜索关键词用于排序
          });
        }
      });

      // 计算相似度并排序
      const albumList = Array.from(albumMap.values()).map(album => {
        const title = album.title.toLowerCase();
        const searchQuery = query.toLowerCase();

        // 计算相似度分数
        let score = 0;

        // 1. 完全匹配 (最高优先级)
        if (title === searchQuery) {
          score = 1000;
        }
        // 2. 开头匹配
        else if (title.startsWith(searchQuery)) {
          score = 500;
        }
        // 3. 包含关键词
        else if (title.includes(searchQuery)) {
          // 关键词越靠前,分数越高
          const position = title.indexOf(searchQuery);
          score = 300 - position;
        }

        return { ...album, _score: score };
      });

      // 按分数降序排序
      albumList.sort((a, b) => b._score - a._score);

      // 移除临时字段
      const sortedData = albumList.map(({ _searchQuery, _score, ...album }) => album);

      return {
        isEnd: true,
        data: sortedData
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

    const res = await axios.get(`${BASE_URL}/api/`, {
      params: {
        source: platform,
        type: "search",
        keyword: searchKeyword,
        limit: 100
      }
    });

    if (res.data.code === 200) {
      const results = res.data.data.results || [];

      // 过滤出匹配的歌曲
      const musicList = results
        .filter((item: any) => {
          // 专辑名必须匹配
          const albumMatch = item.album && item.album.toLowerCase().includes(albumName.toLowerCase());
          // 如果有艺术家信息,艺术家名也要匹配
          const artistMatch = !artistName || (item.artist && item.artist.toLowerCase().includes(artistName.toLowerCase()));
          return albumMatch && artistMatch;
        })
        .map((item: any) => ({
          id: item.id,
          source: platform,
          title: item.name,
          artist: item.artist,
          album: item.album,
          artwork: `${BASE_URL}/api/?source=${platform}&id=${item.id}&type=pic`,
          url: `${BASE_URL}/api/?source=${platform}&id=${item.id}&type=url&br=320k`
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
    const res = await axios.get(`${BASE_URL}/api/`, {
      params: {
        source: platform,
        type: "search",
        keyword: artistName,
        limit: 50
      }
    });

    if (res.data.code === 200) {
      const results = res.data.data.results || [];

      if (type === "music") {
        // 返回歌曲列表
        const musicList = results
          .filter((item: any) => item.artist && item.artist.includes(artistName))
          .map((item: any) => ({
            id: item.id,
            source: platform,
            title: item.name,
            artist: item.artist,
            album: item.album,
            artwork: `${BASE_URL}/api/?source=${platform}&id=${item.id}&type=pic`,
            url: `${BASE_URL}/api/?source=${platform}&id=${item.id}&type=url&br=320k`
          }));

        return {
          isEnd: true,
          data: musicList
        } as any;
      } else if (type === "album") {
        // 返回专辑列表(去重)
        const albumMap = new Map();
        results
          .filter((item: any) => item.artist && item.artist.includes(artistName))
          .forEach((item: any) => {
            if (item.album && !albumMap.has(item.album)) {
              albumMap.set(item.album, {
                id: item.album, // 使用专辑名称作为 ID
                source: platform,
                title: item.album,
                artist: item.artist,
                artwork: `${BASE_URL}/api/?source=${platform}&id=${item.id}&type=pic`
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
