# 剧本ID 标准文档

## 1. 概述
本文档旨在定义剧本的唯一标识(ID)生成规则，主要目标是：
- 按照剧本主题进行分类管理，不再采用纯顺序的编号方式。
- 通过固定格式的ID，便于系统维护、数据统计和后续扩展。

## 2. ID结构定义
采用固定6位数字作为剧本ID，每个ID由两部分组成：
- **主题分类码（前2位）**：代表剧本所属的主题类别，如"10"、"20"、"30"等。
- **序列号（后4位）**：代表当前分类下的剧本顺序号，采用四位数字，序号不足时前补零。

**示例：**
- `100001` 表示归属主题分类"10"的第1个剧本
- `200001` 表示归属主题分类"20"的第1个剧本

## 3. 主题分类码说明
建议根据剧本的核心主题和风格制定不同的分类码。以下为一个示例，具体分类可根据项目实际情况调整：

- **10**：RPG / 随机副本 / 冒险类剧本  
  示例：超能入侵、艾瑞尔大陆的冒险等

- **20**：奇幻 / 魔法 / 梦幻剧本  
  示例：星光下的秘密花园、深海梦境等

- **30**：现代 / 都市 / 恋爱 / 治愈剧本  
  示例：云端咖啡馆、命运咖啡厅的告白、星空许愿屋、时光书店的初恋等

- **40**：DND系列剧本  
  示例：龙与地下城系列（迷失的魔法书、暗影集市的谜团、精灵王庭的宴会、海盗港的宝藏、符文学院的秘密、DND盲盒等）

- **50**：末日 / 生存 / 灾难类剧本  
  示例：末日避难所、生化危机：最后一班地铁、荒岛求生日记等

- **60**：恐怖 / 悬疑 / 跑团模组（如COC）剧本  
  示例：COC盲盒等

- **70**：科幻 / 赛博朋克 / 星际探索剧本  
  示例：赛博朋克：数据猎人、星际探索：奇异信号等

- **80**：武侠 / 江湖剧本  
  示例：江湖奇侠传等

> **备注：** 新增主题时建议预先规划好分类码，避免与已有分类冲突。

## 4. 序列号规则
- 每个分类内的剧本序列号均从 `0001` 开始，新增剧本时在该分类的已有记录基础上递增。
- 序列号务必补齐至4位，保持固定长度。例如，第一个剧本为 `0001`，第二个为 `0002`。

## 5. ID生成流程
1. **主题确定**  
   审核剧本内容，根据故事背景、风格与核心元素，确定其所属主题分类。

2. **匹配分类码**  
   根据确定的主题，查找对应的分类码（例如 RPG 类剧本使用"10"）。

3. **获取当前序列号**  
   在该分类下查询已存在的剧本数，新的剧本序列号即为（现有数量 + 1），并补足4位数字。

4. **组合ID**  
   将分类码与序列号拼接，形成最终的ID（例如："10" + "0001" = `100001`）。

5. **记录保存**  
   生成的ID需存入剧本数据库中，确保每个剧本都有唯一的且不可更改的标识。

## 6. 注意事项
- **唯一性**  
  每个剧本的ID必须全局唯一，不允许重复。

- **不可更改性**  
  一旦剧本ID分配完成，即便剧本内容有调整，ID不得随意更换，以保证数据和历史记录的稳定性。

- **拓展性**  
  在未来有新增剧本类别时，请确保预留合适的分类码，并兼容现有体系。

- **版本控制**  
  如有必要修改或扩展ID标准，需更新本文档并记录修订历史、修改时间及原因。

## 7. 版本信息
- **版本**：1.0  
- **修订日期**：2023年10月  
- **制定人**：剧本管理团队

-----

通过这一标准化ID体系，能够使剧本编号更具可读性和分类属性，便于后续查找、管理和系统集成。 