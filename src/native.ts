import { BASE_URL, PLATFORM_NAMES, QUALITY_MAP, PAGE_SIZE } from './constants';
import { requestWithRetry, buildApiUrl, sortBySimilarity } from './utils';
import {
  ApiResponse,
  AggregateSearchData,
  MusicInfoData,
  TopListsData,
  TopListDetailData,
  PlaylistData,
  ArtistInfo
} from './types';
import { searchAlbum } from './simulated';

/**
 * API 原生支持的功能
 * 包括: 搜索、获取音源、获取歌词、获取音乐详情、排行榜、导入歌单
 */

// 搜索功能
export const search: IPlugin.ISearchFunc = async function (query, page, type) {
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

      if (type === "music") {
        // 聚合搜索返回结果较少，直接返回所有结果
        return {
          isEnd: true,
          data: results.map((item) => ({
            id: item.id,
            platform: item.platform,
            source: item.platform,
            title: item.name,
            artist: item.artist,
            album: item.album || "",
            artwork: buildApiUrl(BASE_URL, item.platform, item.id, 'pic'),
            url: buildApiUrl(BASE_URL, item.platform, item.id, 'url', '320k'),
          }))
        };
      } else if (type === "album") {
        // 调用模拟的专辑搜索功能
        return await searchAlbum(query, page) as any;
      } else if (type === "artist") {
        // 从歌曲结果中提取艺术家信息(去重)
        const artistMap = new Map<string, ArtistInfo>();
        results.forEach((item) => {
          if (item.artist && !artistMap.has(item.artist)) {
            artistMap.set(item.artist, {
              id: item.artist,
              source: item.platform,
              name: item.artist,
              avatar: buildApiUrl(BASE_URL, item.platform, item.id, 'pic'),
            });
          }
        });

        // 使用工具函数排序
        const artistList = sortBySimilarity(
          Array.from(artistMap.values()),
          query,
          (artist) => artist.name,
          true // 支持分词匹配
        );

        // 聚合搜索返回结果较少，直接返回所有结果
        return {
          isEnd: true,
          data: artistList
        };
      }
    }
  } catch (e) {
    console.error("Search error:", e);
  }

  return { isEnd: true, data: [] };
};

// 获取播放链接
export const getMediaSource = async function (
  musicItem: IMusic.IMusicItemPartial,
  quality: IMusic.IQualityKey
): Promise<IPlugin.IMediaSourceResult | null> {
  const platform = musicItem.source || "netease";
  const br = QUALITY_MAP[quality] || "320k";
  const url = buildApiUrl(BASE_URL, platform, musicItem.id, 'url', br);

  // 直接返回 API URL，让 MusicFree 处理 302 重定向
  return { url };
};

// 获取歌词
export const getLyric = async function (
  musicItem: IMusic.IMusicItemPartial
): Promise<ILyric.ILyricSource | null> {
  const platform = musicItem.source || "netease";

  try {
    const data = await requestWithRetry<string>({
      method: 'GET',
      url: `${BASE_URL}/api/`,
      params: {
        source: platform,
        id: musicItem.id,
        type: "lrc"
      },
      responseType: "text"
    });

    return {
      rawLrc: data
    };
  } catch (e) {
    return { rawLrc: "" };
  }
};

// 获取音乐详情（补充封面等信息）
export const getMusicInfo = async function (
  musicBase: IMedia.IMediaBase
): Promise<Partial<IMusic.IMusicItem> | null> {
  const platform = (musicBase as any).source || "netease";

  try {
    const response = await requestWithRetry<ApiResponse<MusicInfoData>>({
      method: 'GET',
      url: `${BASE_URL}/api/`,
      params: {
        source: platform,
        id: musicBase.id,
        type: "info"
      }
    });

    if (response.code === 200) {
      const data = response.data;
      return {
        id: musicBase.id,
        source: platform,
        title: data.name,
        artist: data.artist,
        album: data.album || "",
        artwork: buildApiUrl(BASE_URL, platform, musicBase.id, 'pic'),
      };
    }
  } catch (e) {
    console.error("Get music info error:", e);
  }

  return null;
};

// 获取排行榜列表
export const getTopLists = async function (): Promise<IMusic.IMusicSheetGroupItem[]> {
  const platforms = ["qq", "netease", "kuwo"];
  const result: IMusic.IMusicSheetGroupItem[] = [];

  for (const platform of platforms) {
    try {
      const response = await requestWithRetry<ApiResponse<TopListsData>>({
        method: 'GET',
        url: `${BASE_URL}/api/`,
        params: {
          source: platform,
          type: "toplists"
        }
      });

      if (response.code === 200 && response.data.list) {
        result.push({
          title: PLATFORM_NAMES[platform],
          data: response.data.list.map((item) => ({
            id: item.id,
            platform: platform,
            source: platform,
            title: item.name,
            description: item.updateFrequency || "",
          }))
        });
      }
    } catch (e) {
      // 忽略单个平台错误
    }
  }

  return result;
};

// 获取排行榜详情
export const getTopListDetail = async function (
  topListItem: IMusic.IMusicSheetItem
): Promise<ICommon.WithMusicList<IMusic.IMusicSheetItem>> {
  const platform = topListItem.source || "netease";

  try {
    const response = await requestWithRetry<ApiResponse<TopListDetailData>>({
      method: 'GET',
      url: `${BASE_URL}/api/`,
      params: {
        source: platform,
        id: topListItem.id,
        type: "toplist"
      }
    });

    if (response.code === 200) {
      const list = response.data.list || [];
      return {
        ...topListItem,
        musicList: list.map((item) => ({
          id: item.id,
          platform: platform,
          source: platform,
          title: item.name,
          artist: item.artist || "",
          album: item.album || "",
          artwork: buildApiUrl(BASE_URL, platform, item.id, 'pic'),
          url: buildApiUrl(BASE_URL, platform, item.id, 'url', '320k'),
        }))
      };
    }
  } catch (e) {
    console.error("Get top list detail error:", e);
  }

  return {
    ...topListItem,
    musicList: []
  };
};

// 导入歌单
export const importMusicSheet = async function (
  urlLike: string
): Promise<IMusic.IMusicItem[] | null> {
  // URL 解析规则
  const patterns = [
    // 酷我音乐: https://www.kuwo.cn/playlist_detail/3486842676
    { platform: "kuwo", regex: /kuwo\.cn\/playlist_detail\/(\d+)/ },
    // 网易云音乐: https://music.163.com/#/playlist?id=946216567
    { platform: "netease", regex: /music\.163\.com.*[?&]id=(\d+)/ },
    // QQ音乐: https://i.y.qq.com/n2/m/share/details/taoge.html?id=9629884311
    { platform: "qq", regex: /y\.qq\.com.*[?&]id=(\d+)/ }
  ];

  // 尝试匹配 URL
  for (const { platform, regex } of patterns) {
    const match = urlLike.match(regex);
    if (match) {
      const playlistId = match[1];

      try {
        const response = await requestWithRetry<ApiResponse<PlaylistData>>({
          method: 'GET',
          url: `${BASE_URL}/api/`,
          params: {
            source: platform,
            id: playlistId,
            type: "playlist"
          }
        });

        if (response.code === 200 && response.data.list) {
          // 转换为 IMusicItem 格式
          return response.data.list.map((item) => ({
            id: item.id,
            platform: platform,
            source: platform,
            title: item.name,
            artist: item.artist || "",
            album: item.album || "",
            artwork: buildApiUrl(BASE_URL, platform, item.id, 'pic'),
            url: buildApiUrl(BASE_URL, platform, item.id, 'url', '320k')
          }));
        }
      } catch (e) {
        console.error(`Import playlist error for ${platform}:`, e);
        return null;
      }
    }
  }

  // 未匹配到任何平台
  return null;
};
