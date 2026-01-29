import { BASE_URL, PLATFORM_NAMES, QUALITY_MAP, PAGE_SIZE } from './constants';
import { requestWithRetry, sortBySimilarity, getMethodConfig, executeMethodConfig } from './utils';
import {
  ApiResponse,
  ParseRequest,
  ParseResponseData
} from './types';
import { searchAlbum } from './simulated';

/**
 * API 原生支持的功能 (TuneHub V3)
 * 包括: 搜索、获取音源、获取歌词、排行榜、导入歌单
 */

// 搜索功能 (使用方法下发)
export const search: IPlugin.ISearchFunc = async function (query, page, type) {
  if (type === "album") {
    // 调用模拟的专辑搜索功能
    return await searchAlbum(query, page) as any;
  }

  // 对于 music 和 artist 类型，使用方法下发进行搜索
  const platforms = ["netease", "qq", "kuwo"];
  const allResults: any[] = [];

  for (const platform of platforms) {
    try {
      const config = await getMethodConfig(BASE_URL, platform, 'search');
      if (!config) continue;

      const data = await executeMethodConfig(config, {
        keyword: query,
        page: String(page),
        limit: String(PAGE_SIZE)
      });

      // transform 函数直接返回数组，不是 {list: []}
      if (data && Array.isArray(data)) {
        allResults.push(...data.map((item: any) => ({
          ...item,
          platform,
          source: platform
        })));
      }
    } catch (e) {
      console.error(`Search error for ${platform}:`, e);
    }
  }

  if (type === "music") {
    return {
      isEnd: true,
      data: allResults.map((item) => ({
        id: item.id,
        platform: item.platform,
        source: item.platform,
        title: item.name || item.title,
        artist: item.artist || "",
        album: item.album || "",
        artwork: item.pic || "",
        url: "" // URL 将通过 getMediaSource 获取
      }))
    };
  } else if (type === "artist") {
    // 从歌曲结果中提取艺术家信息(去重)
    const artistMap = new Map<string, any>();
    allResults.forEach((item) => {
      const artistName = item.artist || "";
      if (artistName && !artistMap.has(artistName)) {
        artistMap.set(artistName, {
          id: artistName,
          source: item.platform,
          name: artistName,
          avatar: item.pic || ""
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

    return {
      isEnd: true,
      data: artistList
    };
  }

  return { isEnd: true, data: [] };
};

// 获取播放链接 (使用 /v1/parse 接口)
export const getMediaSource = async function (
  musicItem: IMusic.IMusicItemPartial,
  quality: IMusic.IQualityKey
): Promise<IPlugin.IMediaSourceResult | null> {
  const platform = musicItem.source || "netease";
  const qualityStr = QUALITY_MAP[quality] || "320k";

  try {
    const response = await requestWithRetry<ApiResponse<ParseResponseData>>({
      method: 'POST',
      url: `${BASE_URL}/v1/parse`,
      data: {
        platform,
        ids: String(musicItem.id),
        quality: qualityStr
      } as ParseRequest
    });

    if (response.code === 0 && response.data) {
      const songData = response.data[String(musicItem.id)];
      if (songData && songData.url) {
        return {
          url: songData.url,
          quality
        };
      }
    }
  } catch (e) {
    console.error("Get media source error:", e);
  }

  return null;
};

// 获取歌词 (使用 /v1/parse 接口)
export const getLyric = async function (
  musicItem: IMusic.IMusicItemPartial
): Promise<ILyric.ILyricSource | null> {
  const platform = musicItem.source || "netease";

  try {
    const response = await requestWithRetry<ApiResponse<ParseResponseData>>({
      method: 'POST',
      url: `${BASE_URL}/v1/parse`,
      data: {
        platform,
        ids: String(musicItem.id),
        quality: "128k" // 获取歌词时音质参数不重要，使用最低音质节省积分
      } as ParseRequest
    });

    if (response.code === 0 && response.data) {
      const songData = response.data[String(musicItem.id)];
      if (songData && songData.lrc) {
        return {
          rawLrc: songData.lrc
        };
      }
    }
  } catch (e) {
    console.error("Get lyric error:", e);
  }

  return { rawLrc: "" };
};

// 获取排行榜列表 (使用方法下发)
export const getTopLists = async function (): Promise<IMusic.IMusicSheetGroupItem[]> {
  const platforms = ["netease", "qq", "kuwo"];
  const result: IMusic.IMusicSheetGroupItem[] = [];

  for (const platform of platforms) {
    try {
      const config = await getMethodConfig(BASE_URL, platform, 'toplists');
      if (!config) continue;

      const data = await executeMethodConfig(config);

      // transform 函数直接返回数组
      if (data && Array.isArray(data)) {
        result.push({
          title: PLATFORM_NAMES[platform],
          data: data.map((item: any) => ({
            id: item.id,
            platform: platform,
            source: platform,
            title: item.name || item.title,
            description: item.updateFrequency || item.description || "",
            coverImg: item.pic || ""
          }))
        });
      }
    } catch (e) {
      console.error(`Get toplists error for ${platform}:`, e);
    }
  }

  return result;
};

// 获取排行榜详情 (使用方法下发)
export const getTopListDetail = async function (
  topListItem: IMusic.IMusicSheetItem
): Promise<ICommon.WithMusicList<IMusic.IMusicSheetItem>> {
  const platform = topListItem.source || "netease";

  try {
    const config = await getMethodConfig(BASE_URL, platform, 'toplist');
    if (!config) {
      return { ...topListItem, musicList: [] };
    }

    const data = await executeMethodConfig(config, {
      id: String(topListItem.id)
    });

    // transform 函数直接返回数组
    if (data && Array.isArray(data)) {
      return {
        ...topListItem,
        musicList: data.map((item: any) => ({
          id: item.id,
          platform: platform,
          source: platform,
          title: item.name || item.title,
          artist: item.artist || "",
          album: item.album || "",
          artwork: item.pic || "",
          url: "" // URL 将通过 getMediaSource 获取
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

// 导入歌单 (使用方法下发)
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
    // QQ音乐新版: https://y.qq.com/n/ryqq/playlist/9629884311
    { platform: "qq", regex: /y\.qq\.com.*(?:playlist\/|[?&]id=)(\d+)/ }
  ];

  // 尝试匹配 URL
  for (const { platform, regex } of patterns) {
    const match = urlLike.match(regex);
    if (match) {
      const playlistId = match[1];

      try {
        const config = await getMethodConfig(BASE_URL, platform, 'playlist');
        if (!config) continue;

        const data = await executeMethodConfig(config, {
          id: playlistId
        });

        // transform 函数返回 {info: {...}, list: [...]}
        if (data && data.list && Array.isArray(data.list)) {
          // 转换为 IMusicItem 格式
          return data.list.map((item: any) => ({
            id: item.id,
            platform: platform,
            source: platform,
            title: item.name || item.title,
            artist: item.artist || "",
            album: item.album || "",
            artwork: item.pic || "",
            url: "" // URL 将通过 getMediaSource 获取
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
