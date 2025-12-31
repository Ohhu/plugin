import axios from 'axios';
import { BASE_URL, PLATFORM_NAMES, QUALITY_MAP } from './constants';
import { searchAlbum } from './simulated';

/**
 * API 原生支持的功能
 * 包括: 搜索、获取音源、获取歌词、获取音乐详情、排行榜、导入歌单
 */

// 搜索功能
export const search: IPlugin.ISearchFunc = async function (query, page, type) {
  try {
    const res = await axios.get(`${BASE_URL}/api/`, {
      params: {
        type: "aggregateSearch",
        keyword: query
      }
    });

    if (res.data.code === 200) {
      const results = res.data.data.results || [];

      if (type === "music") {
        // 返回歌曲列表
        return {
          isEnd: true,
          data: results.map((item: any) => ({
            id: item.id,
            source: item.platform,
            title: item.name,
            artist: item.artist,
            album: item.album || "",
            artwork: `${BASE_URL}/api/?source=${item.platform}&id=${item.id}&type=pic`,
            url: `${BASE_URL}/api/?source=${item.platform}&id=${item.id}&type=url&br=320k`,
          }))
        };
      } else if (type === "album") {
        // 调用模拟的专辑搜索功能
        return await searchAlbum(query, page) as any;
      } else if (type === "artist") {
        // 从歌曲结果中提取艺术家信息(去重)
        const artistMap = new Map();
        results.forEach((item: any) => {
          if (item.artist && !artistMap.has(item.artist)) {
            artistMap.set(item.artist, {
              id: item.artist,
              source: item.platform,
              name: item.artist,
              avatar: `${BASE_URL}/api/?source=${item.platform}&id=${item.id}&type=pic`,
              _searchQuery: query.toLowerCase() // 保存搜索关键词用于排序
            });
          }
        });

        // 计算相似度并排序
        const artistList = Array.from(artistMap.values()).map(artist => {
          const name = artist.name.toLowerCase();
          const searchQuery = query.toLowerCase();

          // 计算相似度分数
          let score = 0;

          // 1. 完全匹配 (最高优先级)
          if (name === searchQuery) {
            score = 1000;
          }
          // 2. 开头匹配
          else if (name.startsWith(searchQuery)) {
            score = 500;
          }
          // 3. 包含关键词
          else if (name.includes(searchQuery)) {
            // 关键词越靠前,分数越高
            const position = name.indexOf(searchQuery);
            score = 300 - position;
          }
          // 4. 分词匹配 (处理多个艺术家的情况,如 "周杰伦、李硕、张鑫")
          else {
            const artists = name.split(/[、,，]/).map(a => a.trim());
            for (let i = 0; i < artists.length; i++) {
              if (artists[i] === searchQuery) {
                score = 800 - i * 100; // 第一个艺术家分数最高
                break;
              } else if (artists[i].startsWith(searchQuery)) {
                score = 400 - i * 50;
                break;
              } else if (artists[i].includes(searchQuery)) {
                score = 200 - i * 20;
                break;
              }
            }
          }

          return { ...artist, _score: score };
        });

        // 按分数降序排序
        artistList.sort((a, b) => b._score - a._score);

        // 移除临时字段
        const sortedData = artistList.map(({ _searchQuery, _score, ...artist }) => artist);

        return {
          isEnd: true,
          data: sortedData
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
  const url = `${BASE_URL}/api/?source=${platform}&id=${musicItem.id}&type=url&br=${br}`;

  // 直接返回 API URL，让 MusicFree 处理 302 重定向
  return { url };
};

// 获取歌词
export const getLyric = async function (
  musicItem: IMusic.IMusicItemPartial
): Promise<ILyric.ILyricSource | null> {
  const platform = musicItem.source || "netease";

  try {
    const res = await axios.get(`${BASE_URL}/api/`, {
      params: {
        source: platform,
        id: musicItem.id,
        type: "lrc"
      },
      responseType: "text"
    });

    return {
      rawLrc: res.data
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
    const res = await axios.get(`${BASE_URL}/api/`, {
      params: {
        source: platform,
        id: musicBase.id,
        type: "info"
      }
    });

    if (res.data.code === 200) {
      const data = res.data.data;
      return {
        id: musicBase.id,
        source: platform,
        title: data.name,
        artist: data.artist,
        album: data.album || "",
        artwork: `${BASE_URL}/api/?source=${platform}&id=${musicBase.id}&type=pic`,
      };
    }
  } catch (e) {
    console.error("Get music info error:", e);
  }

  return null;
};

// 获取排行榜列表
export const getTopLists = async function (): Promise<IMusic.IMusicSheetGroupItem[]> {
  const platforms = ["netease", "kuwo", "qq"];
  const result: IMusic.IMusicSheetGroupItem[] = [];

  for (const platform of platforms) {
    try {
      const res = await axios.get(`${BASE_URL}/api/`, {
        params: {
          source: platform,
          type: "toplists"
        }
      });

      if (res.data.code === 200 && res.data.data.list) {
        result.push({
          title: PLATFORM_NAMES[platform],
          data: res.data.data.list.map((item: any) => ({
            id: item.id,
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
    const res = await axios.get(`${BASE_URL}/api/`, {
      params: {
        source: platform,
        id: topListItem.id,
        type: "toplist"
      }
    });

    if (res.data.code === 200) {
      const list = res.data.data.list || [];
      return {
        ...topListItem,
        musicList: list.map((item: any) => ({
          id: item.id,
          source: platform,
          title: item.name,
          artist: item.artist || "",
          album: item.album || "",
          artwork: `${BASE_URL}/api/?source=${platform}&id=${item.id}&type=pic`,
          url: `${BASE_URL}/api/?source=${platform}&id=${item.id}&type=url&br=320k`,
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
        const res = await axios.get(`${BASE_URL}/api/`, {
          params: {
            source: platform,
            id: playlistId,
            type: "playlist"
          }
        });

        if (res.data.code === 200 && res.data.data.list) {
          // 转换为 IMusicItem 格式
          return res.data.data.list.map((item: any) => ({
            id: item.id,
            source: platform,
            title: item.name,
            artist: item.artist || "",
            album: item.album || "",
            artwork: `${BASE_URL}/api/?source=${platform}&id=${item.id}&type=pic`,
            url: `${BASE_URL}/api/?source=${platform}&id=${item.id}&type=url&br=320k`
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
