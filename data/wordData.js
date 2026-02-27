// 识字字库 - 分主题分类
// 每关 20 个字，共 15 关

const wordData = {
  levels: [
    {
      id: 1,
      name: "家庭篇",
      icon: "🏠",
      color: "#FFB6C1",
      words: [
        { char: "爸", pinyin: "bà", group: "爸爸", example: "我爱爸爸" },
        { char: "妈", pinyin: "mā", group: "妈妈", example: "妈妈爱我" },
        { char: "爷", pinyin: "yé", group: "爷爷", example: "爷爷讲故事" },
        { char: "奶", pinyin: "nǎi", group: "奶奶", example: "奶奶做饭" },
        { char: "哥", pinyin: "gē", group: "哥哥", example: "哥哥上学" },
        { char: "姐", pinyin: "jiě", group: "姐姐", example: "姐姐唱歌" },
        { char: "弟", pinyin: "dì", group: "弟弟", example: "弟弟玩玩具" },
        { char: "妹", pinyin: "mèi", group: "妹妹", example: "妹妹可爱" },
        { char: "我", pinyin: "wǒ", group: "我们", example: "我们去玩" },
        { char: "人", pinyin: "rén", group: "大人", example: "大人工作" },
        { char: "家", pinyin: "jiā", group: "家庭", example: "我爱我家" },
        { char: "亲", pinyin: "qīn", group: "亲人", example: "亲人团聚" },
        { char: "父", pinyin: "fù", group: "父亲", example: "父亲节快乐" },
        { char: "母", pinyin: "mǔ", group: "母亲", example: "母亲节快乐" },
        { char: "子", pinyin: "zi", group: "孩子", example: "孩子长大了" },
        { char: "女", pinyin: "nǚ", group: "女儿", example: "女儿真棒" },
        { char: "儿", pinyin: "ér", group: "儿子", example: "儿子爱运动" },
        { char: "宝", pinyin: "bǎo", group: "宝宝", example: "宝宝乖" },
        { char: "贝", pinyin: "bèi", group: "宝贝", example: "宝贝真聪明" },
        { char: "园", pinyin: "yuán", group: "家园", example: "家园美好" }
      ]
    },
    {
      id: 2,
      name: "身体篇",
      icon: "👶",
      color: "#FFC0CB",
      words: [
        { char: "头", pinyin: "tóu", group: "头发", example: "头发黑黑" },
        { char: "耳", pinyin: "ěr", group: "耳朵", example: "耳朵听声音" },
        { char: "目", pinyin: "mù", group: "目光", example: "目光亮晶晶" },
        { char: "口", pinyin: "kǒu", group: "口水", example: "口水解渴" },
        { char: "鼻", pinyin: "bí", group: "鼻子", example: "鼻子闻花香" },
        { char: "手", pinyin: "shǒu", group: "手指", example: "手指数数" },
        { char: "足", pinyin: "zú", group: "足球", example: "足部健康" },
        { char: "心", pinyin: "xīn", group: "心脏", example: "心儿砰砰跳" },
        { char: "牙", pinyin: "yá", group: "牙齿", example: "牙齿白白的" },
        { char: "舌", pinyin: "shé", group: "舌头", example: "舌头尝味道" },
        { char: "毛", pinyin: "máo", group: "眉毛", example: "眉毛弯弯" },
        { char: "发", pinyin: "fà", group: "头发", example: "头发长长" },
        { char: "脸", pinyin: "liǎn", group: "笑脸", example: "笑脸真美" },
        { char: "眼", pinyin: "yǎn", group: "眼睛", example: "眼睛看世界" },
        { char: "眉", pinyin: "méi", group: "眉毛", example: "眉开眼笑" },
        { char: "肩", pinyin: "jiān", group: "肩膀", example: "肩膀扛东西" },
        { char: "背", pinyin: "bèi", group: "后背", example: "后背挺直" },
        { char: "肚", pinyin: "dù", group: "肚子", example: "肚子饿了" },
        { char: "腿", pinyin: "tuǐ", group: "大腿", example: "腿儿跑跑" },
        { char: "脚", pinyin: "jiǎo", group: "小脚", example: "脚丫踩水" }
      ]
    },
    {
      id: 3,
      name: "数字篇",
      icon: "🔢",
      color: "#FFE4E1",
      words: [
        { char: "一", pinyin: "yī", group: "一个", example: "一个苹果" },
        { char: "二", pinyin: "èr", group: "二个", example: "二只小鸟" },
        { char: "三", pinyin: "sān", group: "三个", example: "三朵花" },
        { char: "四", pinyin: "sì", group: "四个", example: "四辆车" },
        { char: "五", pinyin: "wǔ", group: "五个", example: "五颗星" },
        { char: "六", pinyin: "liù", group: "六个", example: "六只小鸭" },
        { char: "七", pinyin: "qī", group: "七个", example: "七色彩虹" },
        { char: "八", pinyin: "bā", group: "八个", example: "八条小鱼" },
        { char: "九", pinyin: "jiǔ", group: "九个", example: "九只小兔" },
        { char: "十", pinyin: "shí", group: "十个", example: "十根手指" },
        { char: "百", pinyin: "bǎi", group: "一百", example: "一百朵花" },
        { char: "千", pinyin: "qiān", group: "一千", example: "千纸鹤" },
        { char: "万", pinyin: "wàn", group: "一万", example: "万里长城" },
        { char: "第", pinyin: "dì", group: "第一", example: "第一名" },
        { char: "几", pinyin: "jǐ", group: "几个", example: "几个人" },
        { char: "多", pinyin: "duō", group: "多少", example: "多少个" },
        { char: "少", pinyin: "shǎo", group: "少数", example: "少一点" },
        { char: "半", pinyin: "bàn", group: "一半", example: "半个西瓜" },
        { char: "双", pinyin: "shuāng", group: "一双", example: "一双鞋" },
        { char: "对", pinyin: "duì", group: "一对", example: "一对小鸟" }
      ]
    },
    {
      id: 4,
      name: "自然篇·天地",
      icon: "🌙",
      color: "#DDA0DD",
      words: [
        { char: "天", pinyin: "tiān", group: "天空", example: "天空蓝蓝" },
        { char: "地", pinyin: "dì", group: "大地", example: "大地绿绿" },
        { char: "日", pinyin: "rì", group: "日出", example: "日出东方" },
        { char: "月", pinyin: "yuè", group: "月亮", example: "月亮弯弯" },
        { char: "星", pinyin: "xīng", group: "星星", example: "星星眨眼" },
        { char: "辰", pinyin: "chén", group: "星辰", example: "星辰大海" },
        { char: "风", pinyin: "fēng", group: "大风", example: "风吹树叶" },
        { char: "云", pinyin: "yún", group: "白云", example: "云朵飘飘" },
        { char: "雨", pinyin: "yǔ", group: "下雨", example: "雨滴答答" },
        { char: "雪", pinyin: "xuě", group: "雪花", example: "雪花白白" },
        { char: "雷", pinyin: "léi", group: "打雷", example: "雷声隆隆" },
        { char: "电", pinyin: "diàn", group: "闪电", example: "电光闪闪" },
        { char: "雾", pinyin: "wù", group: "大雾", example: "雾蒙蒙" },
        { char: "霜", pinyin: "shuāng", group: "霜花", example: "霜花晶莹" },
        { char: "露", pinyin: "lù", group: "露珠", example: "露珠圆圆" },
        { char: "虹", pinyin: "hóng", group: "彩虹", example: "彩虹美丽" },
        { char: "霞", pinyin: "xiá", group: "晚霞", example: "晚霞红红" },
        { char: "晴", pinyin: "qíng", group: "晴天", example: "晴空万里" },
        { char: "阴", pinyin: "yīn", group: "阴天", example: "阴云密布" },
        { char: "空", pinyin: "kōng", group: "天空", example: "空中飞翔" }
      ]
    },
    {
      id: 5,
      name: "自然篇·山水",
      icon: "🏔️",
      color: "#98FB98",
      words: [
        { char: "山", pinyin: "shān", group: "高山", example: "山高路远" },
        { char: "水", pinyin: "shuǐ", group: "河水", example: "水儿清清" },
        { char: "火", pinyin: "huǒ", group: "大火", example: "火红太阳" },
        { char: "土", pinyin: "tǔ", group: "土地", example: "土地肥沃" },
        { char: "金", pinyin: "jīn", group: "金色", example: "金光闪闪" },
        { char: "石", pinyin: "shí", group: "石头", example: "石头硬硬" },
        { char: "木", pinyin: "mù", group: "树木", example: "木头做桌子" },
        { char: "禾", pinyin: "hé", group: "禾苗", example: "禾苗青青" },
        { char: "田", pinyin: "tián", group: "田地", example: "田地宽广" },
        { char: "河", pinyin: "hé", group: "小河", example: "河水流淌" },
        { char: "江", pinyin: "jiāng", group: "长江", example: "江水滔滔" },
        { char: "海", pinyin: "hǎi", group: "大海", example: "海浪拍拍" },
        { char: "湖", pinyin: "hú", group: "湖水", example: "湖面平静" },
        { char: "池", pinyin: "chí", group: "水池", example: "池水清澈" },
        { char: "溪", pinyin: "xī", group: "小溪", example: "溪水潺潺" },
        { char: "泉", pinyin: "quán", group: "泉水", example: "泉水甘甜" },
        { char: "岛", pinyin: "dǎo", group: "小岛", example: "岛上风景" },
        { char: "岸", pinyin: "àn", group: "河岸", example: "岸边柳树" },
        { char: "坡", pinyin: "pō", group: "山坡", example: "坡上青草" },
        { char: "谷", pinyin: "gǔ", group: "山谷", example: "谷中回声" }
      ]
    },
    {
      id: 6,
      name: "动物篇",
      icon: "🐾",
      color: "#FFD700",
      words: [
        { char: "马", pinyin: "mǎ", group: "小马", example: "小马跑跑" },
        { char: "牛", pinyin: "niú", group: "黄牛", example: "牛儿吃草" },
        { char: "羊", pinyin: "yáng", group: "山羊", example: "山羊爬山" },
        { char: "猪", pinyin: "zhū", group: "小猪", example: "小猪胖胖" },
        { char: "狗", pinyin: "gǒu", group: "小狗", example: "小狗汪汪" },
        { char: "猫", pinyin: "māo", group: "小猫", example: "小猫喵喵" },
        { char: "鸟", pinyin: "niǎo", group: "小鸟", example: "小鸟飞飞" },
        { char: "鱼", pinyin: "yú", group: "小鱼", example: "小鱼游游" },
        { char: "虫", pinyin: "chóng", group: "小虫", example: "小虫爬爬" },
        { char: "鸡", pinyin: "jī", group: "小鸡", example: "小鸡叽叽" },
        { char: "鸭", pinyin: "yā", group: "小鸭", example: "小鸭嘎嘎" },
        { char: "鹅", pinyin: "é", group: "白鹅", example: "白鹅游水" },
        { char: "兔", pinyin: "tù", group: "兔子", example: "兔子跳跳" },
        { char: "虎", pinyin: "hǔ", group: "老虎", example: "老虎威武" },
        { char: "狮", pinyin: "shī", group: "狮子", example: "狮子吼叫" },
        { char: "象", pinyin: "xiàng", group: "大象", example: "大象长鼻子" },
        { char: "猴", pinyin: "hóu", group: "猴子", example: "猴子爬树" },
        { char: "鹿", pinyin: "lù", group: "小鹿", example: "小鹿美丽" },
        { char: "熊", pinyin: "xióng", group: "熊", example: "熊大熊二" },
        { char: "鼠", pinyin: "shǔ", group: "老鼠", example: "老鼠偷米" }
      ]
    },
    {
      id: 7,
      name: "植物篇",
      icon: "🌿",
      color: "#90EE90",
      words: [
        { char: "草", pinyin: "cǎo", group: "小草", example: "小草青青" },
        { char: "树", pinyin: "shù", group: "大树", example: "大树高高" },
        { char: "花", pinyin: "huā", group: "花朵", example: "花朵美丽" },
        { char: "叶", pinyin: "yè", group: "树叶", example: "树叶飘飘" },
        { char: "果", pinyin: "guǒ", group: "水果", example: "水果甜甜" },
        { char: "种", pinyin: "zhǒng", group: "种子", example: "种子发芽" },
        { char: "苗", pinyin: "miáo", group: "树苗", example: "树苗长大" },
        { char: "林", pinyin: "lín", group: "森林", example: "森林茂密" },
        { char: "森", pinyin: "sēn", group: "森林", example: "森林美丽" },
        { char: "梅", pinyin: "méi", group: "梅花", example: "梅花香香" },
        { char: "兰", pinyin: "lán", group: "兰花", example: "兰花优雅" },
        { char: "竹", pinyin: "zhú", group: "竹子", example: "竹子青青" },
        { char: "菊", pinyin: "jú", group: "菊花", example: "菊花盛开" },
        { char: "莲", pinyin: "lián", group: "莲花", example: "莲花纯洁" },
        { char: "松", pinyin: "sōng", group: "松树", example: "松树挺拔" },
        { char: "柏", pinyin: "bǎi", group: "柏树", example: "柏树常青" },
        { char: "柳", pinyin: "liǔ", group: "柳树", example: "柳树依依" },
        { char: "桃", pinyin: "táo", group: "桃子", example: "桃子红红" },
        { char: "李", pinyin: "lǐ", group: "李子", example: "李子甜甜" },
        { char: "杏", pinyin: "xìng", group: "杏子", example: "杏子黄黄" }
      ]
    },
    {
      id: 8,
      name: "颜色篇",
      icon: "🎨",
      color: "#DDA0DD",
      words: [
        { char: "红", pinyin: "hóng", group: "红色", example: "红旗飘飘" },
        { char: "黄", pinyin: "huáng", group: "黄色", example: "黄金闪闪" },
        { char: "蓝", pinyin: "lán", group: "蓝色", example: "蓝天白云" },
        { char: "绿", pinyin: "lǜ", group: "绿色", example: "绿叶青青" },
        { char: "白", pinyin: "bái", group: "白色", example: "白云朵朵" },
        { char: "黑", pinyin: "hēi", group: "黑色", example: "黑发飘飘" },
        { char: "紫", pinyin: "zǐ", group: "紫色", example: "紫色美丽" },
        { char: "粉", pinyin: "fěn", group: "粉色", example: "粉色可爱" },
        { char: "灰", pinyin: "huī", group: "灰色", example: "灰色天空" },
        { char: "橙", pinyin: "chéng", group: "橙色", example: "橙色温暖" },
        { char: "青", pinyin: "qīng", group: "青色", example: "青草青青" },
        { char: "金", pinyin: "jīn", group: "金色", example: "金色阳光" },
        { char: "银", pinyin: "yín", group: "银色", example: "银色月光" },
        { char: "铜", pinyin: "tóng", group: "铜色", example: "铜色温暖" },
        { char: "铁", pinyin: "tiě", group: "铁色", example: "铁黑铁黑" },
        { char: "彩", pinyin: "cǎi", group: "彩色", example: "彩虹美丽" },
        { char: "艳", pinyin: "yàn", group: "鲜艳", example: "鲜艳美丽" },
        { char: "暗", pinyin: "àn", group: "暗色", example: "暗暗的" },
        { char: "亮", pinyin: "liàng", group: "明亮", example: "亮亮堂堂" },
        { char: "明", pinyin: "míng", group: "明亮", example: "明亮明亮" }
      ]
    },
    {
      id: 9,
      name: "方向篇",
      icon: "🧭",
      color: "#F0E68C",
      words: [
        { char: "东", pinyin: "dōng", group: "东方", example: "东方红红" },
        { char: "西", pinyin: "xī", group: "西方", example: "西方蓝蓝" },
        { char: "南", pinyin: "nán", group: "南方", example: "南方暖和" },
        { char: "北", pinyin: "běi", group: "北方", example: "北方凉凉" },
        { char: "中", pinyin: "zhōng", group: "中间", example: "中间中间" },
        { char: "上", pinyin: "shàng", group: "上面", example: "上面上面" },
        { char: "下", pinyin: "xià", group: "下面", example: "下面下面" },
        { char: "左", pinyin: "zuǒ", group: "左边", example: "左边左边" },
        { char: "右", pinyin: "yòu", group: "右边", example: "右边右边" },
        { char: "前", pinyin: "qián", group: "前面", example: "前面前面" },
        { char: "后", pinyin: "hòu", group: "后面", example: "后面后面" },
        { char: "里", pinyin: "lǐ", group: "里面", example: "里面里面" },
        { char: "外", pinyin: "wài", group: "外面", example: "外面外面" },
        { char: "内", pinyin: "nèi", group: "内部", example: "内部内部" },
        { char: "旁", pinyin: "páng", group: "旁边", example: "旁边旁边" },
        { char: "边", pinyin: "biān", group: "边上", example: "边上边上" },
        { char: "间", pinyin: "jiān", group: "中间", example: "中间中间" },
        { char: "远", pinyin: "yuǎn", group: "远方", example: "远方远方" },
        { char: "近", pinyin: "jìn", group: "近处", example: "近处近处" },
        { char: "高", pinyin: "gāo", group: "高处", example: "高高在上" }
      ]
    },
    {
      id: 10,
      name: "学校篇",
      icon: "🏫",
      color: "#87CEEB",
      words: [
        { char: "学", pinyin: "xué", group: "学习", example: "学习学习" },
        { char: "校", pinyin: "xiào", group: "学校", example: "学校学校" },
        { char: "书", pinyin: "shū", group: "书本", example: "书本书本" },
        { char: "本", pinyin: "běn", group: "本子", example: "本子本子" },
        { char: "笔", pinyin: "bǐ", group: "笔", example: "铅笔铅笔" },
        { char: "纸", pinyin: "zhǐ", group: "纸", example: "白纸白纸" },
        { char: "课", pinyin: "kè", group: "课程", example: "上课上课" },
        { char: "堂", pinyin: "táng", group: "课堂", example: "课堂课堂" },
        { char: "师", pinyin: "shī", group: "老师", example: "老师老师" },
        { char: "生", pinyin: "shēng", group: "学生", example: "学生学生" },
        { char: "友", pinyin: "yǒu", group: "朋友", example: "朋友朋友" },
        { char: "同", pinyin: "tóng", group: "同学", example: "同学同学" },
        { char: "班", pinyin: "bān", group: "班级", example: "班级班级" },
        { char: "级", pinyin: "jí", group: "年级", example: "年级年级" },
        { char: "读", pinyin: "dú", group: "读书", example: "读书读书" },
        { char: "写", pinyin: "xiě", group: "写字", example: "写字写字" },
        { char: "画", pinyin: "huà", group: "画画", example: "画画画画" },
        { char: "唱", pinyin: "chàng", group: "唱歌", example: "唱歌唱歌" },
        { char: "跳", pinyin: "tiào", group: "跳舞", example: "跳舞跳舞" },
        { char: "跑", pinyin: "pǎo", group: "跑步", example: "跑步跑步" }
      ]
    }
  ],

  // 获取今日学习的字（根据日期自动分配）
  getTodayWords: function() {
    const today = new Date();
    const startDate = new Date('2024-09-01'); // 学年开始
    const dayIndex = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const levelIndex = dayIndex % this.levels.length;
    const wordStartIndex = Math.floor(dayIndex / this.levels.length) * 3 % 20;

    const level = this.levels[levelIndex];
    const words = [];
    for (let i = 0; i < 3 && i + wordStartIndex < level.words.length; i++) {
      words.push(level.words[wordStartIndex + i]);
    }
    return { level, words };
  },

  // 根据关卡 ID 获取关卡数据
  getLevel: function(levelId) {
    return this.levels.find(l => l.id === levelId);
  },

  // 获取所有字的扁平列表
  getAllWords: function() {
    return this.levels.flatMap(l => l.words);
  }
};

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = wordData;
}
