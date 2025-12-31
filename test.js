// 测试脚本
const plugin = require('./dist/Tunehub.js');
const axios = require('axios');

async function test() {
  console.log('=== 插件信息 ===');
  console.log('平台:', plugin.platform);
  console.log('版本:', plugin.version);
  console.log('主键:', plugin.primaryKey);
  console.log('');

  // 测试排行榜
  console.log('=== 测试排行榜列表 ===');
  try {
    const topLists = await plugin.getTopLists();
    console.log('排行榜分组数量:', topLists.length);

    topLists.forEach((group, index) => {
      console.log(`\n${index + 1}. ${group.title}`);
      console.log(`   榜单数量: ${group.data.length}`);
      if (group.data.length > 0) {
        console.log(`   示例榜单: ${group.data[0].title} (ID: ${group.data[0].id})`);
      }
    });

    // 测试每个平台的第一个榜单详情
    if (topLists.length > 0) {
      console.log('\n\n=== 测试排行榜详情和音源获取 ===');

      for (const group of topLists) {
        if (group.data.length > 0) {
          const firstTopList = group.data[0];
          console.log(`\n${'='.repeat(60)}`);
          console.log(`📊 ${group.title} - ${firstTopList.title}`);
          console.log(`${'='.repeat(60)}`);

          try {
            const topListDetail = await plugin.getTopListDetail(firstTopList);
            console.log(`榜单歌曲数量: ${topListDetail.musicList?.length || 0}`);

            if (topListDetail.musicList && topListDetail.musicList.length > 0) {
              // 获取第一首歌
              const firstSong = topListDetail.musicList[0];
              console.log(`\n🎵 第一首歌曲信息:`);
              console.log(`   标题: ${firstSong.title}`);
              console.log(`   艺术家: ${firstSong.artist || '(无)'}`);
              console.log(`   专辑: ${firstSong.album || '(无)'}`);
              console.log(`   ID: ${firstSong.id}`);
              console.log(`   平台: ${firstSong.source}`);

              // 测试获取音源
              console.log(`\n🔗 测试获取音源:`);
              try {
                const mediaSource = await plugin.getMediaSource(firstSong, 'standard');
                console.log(`   插件返回URL: ${mediaSource.url}`);

                // 尝试跟随重定向获取真实URL
                console.log(`\n🌐 跟随重定向获取真实音频URL:`);

                // 手动跟踪重定向过程
                let currentUrl = mediaSource.url;
                let redirectCount = 0;
                const maxRedirects = 10;

                try {
                  while (redirectCount < maxRedirects) {
                    console.log(`\n   [步骤 ${redirectCount + 1}]`);
                    console.log(`   方法: GET`);
                    console.log(`   URL: ${currentUrl.substring(0, 100)}${currentUrl.length > 100 ? '...' : ''}`);

                    try {
                      const response = await axios.get(currentUrl, {
                        maxRedirects: 0,  // 不自动跟随重定向
                        validateStatus: (status) => status >= 200 && status < 400,
                        timeout: 10000
                      });

                      console.log(`   响应状态: HTTP ${response.status} ${response.statusText || ''}`);

                      // 如果是 200，说明到达最终URL
                      if (response.status === 200) {
                        console.log(`   ✅ 到达最终URL`);
                        console.log(`   响应头:`);
                        console.log(`     - Content-Type: ${response.headers['content-type']}`);
                        console.log(`     - Content-Length: ${response.headers['content-length'] || '未知'}`);
                        if (response.headers['server']) {
                          console.log(`     - Server: ${response.headers['server']}`);
                        }

                        // 检查是否是音频文件
                        const contentType = response.headers['content-type'] || '';
                        if (contentType.includes('audio') || contentType.includes('mpeg') || contentType.includes('mp3')) {
                          console.log(`   ✅ 确认是音频文件`);
                        } else {
                          console.log(`   ⚠️  Content-Type 不是音频: ${contentType}`);
                        }

                        console.log(`   最终URL: ${currentUrl}`);
                        break;
                      }

                      // 如果是 302/301，继续跟随
                      if (response.status === 302 || response.status === 301) {
                        const location = response.headers.location;
                        console.log(`   → 重定向到: ${location?.substring(0, 100)}${location && location.length > 100 ? '...' : ''}`);

                        if (!location) {
                          console.log(`   ❌ 没有 Location 头`);
                          break;
                        }

                        currentUrl = location;
                        redirectCount++;
                      }

                    } catch (stepError) {
                      if (stepError.response) {
                        const status = stepError.response.status;
                        console.log(`   响应状态: HTTP ${status} ${stepError.response.statusText || ''}`);

                        if (status === 302 || status === 301) {
                          const location = stepError.response.headers.location;
                          console.log(`   → 重定向到: ${location?.substring(0, 100)}${location && location.length > 100 ? '...' : ''}`);

                          if (!location) {
                            console.log(`   ❌ 没有 Location 头`);
                            break;
                          }

                          currentUrl = location;
                          redirectCount++;
                        } else {
                          console.log(`   ❌ 请求失败`);
                          console.log(`   响应头:`);
                          if (stepError.response.headers['content-type']) {
                            console.log(`     - Content-Type: ${stepError.response.headers['content-type']}`);
                          }
                          if (stepError.response.headers['server']) {
                            console.log(`     - Server: ${stepError.response.headers['server']}`);
                          }
                          if (stepError.response.data) {
                            const data = typeof stepError.response.data === 'string'
                              ? stepError.response.data
                              : JSON.stringify(stepError.response.data);
                            console.log(`   响应数据: ${data.substring(0, 200)}`);
                          }
                          break;
                        }
                      } else {
                        console.log(`   ❌ 请求失败: ${stepError.message}`);
                        console.log(`   错误代码: ${stepError.code || '未知'}`);
                        break;
                      }
                    }
                  }

                  if (redirectCount >= maxRedirects) {
                    console.log(`\n   ⚠️  达到最大重定向次数 (${maxRedirects})`);
                  }

                } catch (error) {
                  console.log(`\n   ❌ 重定向跟踪失败: ${error.message}`);
                }

                // 测试封面图片
                console.log(`\n🖼️  测试获取封面图片:`);
                console.log(`   封面URL: ${firstSong.artwork}`);
                try {
                  const artworkResponse = await axios.head(firstSong.artwork, {
                    maxRedirects: 5,
                    timeout: 10000
                  });
                  console.log(`   ✅ 封面图片可访问 (${artworkResponse.headers['content-type']})`);
                } catch (artworkError) {
                  console.log(`   ❌ 封面图片访问失败: ${artworkError.message}`);
                }

              } catch (e) {
                console.error(`   ❌ 获取音源失败: ${e.message}`);
              }

              // 测试歌词
              console.log(`\n📝 测试获取歌词:`);
              try {
                const lyric = await plugin.getLyric(firstSong);
                if (lyric && lyric.rawLrc) {
                  const lines = lyric.rawLrc.split('\n').filter(l => l.trim());
                  console.log(`   ✅ 获取歌词成功 (共 ${lines.length} 行)`);
                  console.log(`   前2行: ${lines.slice(0, 2).join(' / ')}`);
                } else {
                  console.log(`   ⚠️  未获取到歌词`);
                }
              } catch (e) {
                console.error(`   ❌ 获取歌词失败: ${e.message}`);
              }

            } else {
              console.log('⚠️  榜单没有歌曲');
            }
          } catch (e) {
            console.error(`❌ 获取 ${group.title} 榜单详情失败: ${e.message}`);
          }

          // 添加延迟
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
  } catch (e) {
    console.error('排行榜测试失败:', e.message);
  }

  console.log('\n\n=== 测试完成 ===');
  console.log('✅ 所有测试已执行完毕');
}

// 运行测试
test().then(() => {
  console.log('\n测试脚本执行完成！');
}).catch(err => {
  console.error('\n测试出错:', err);
  process.exit(1);
});
