import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import { getGlobalExcalidrawAPI } from "@/hooks/useMenuHandler";

export interface MermaidConversionResult {
  elements: any[];
  files: Record<string, any>;
}

export interface MermaidConversionOptions {
  fontSize?: string;
}

/**
 * 将 Mermaid 代码转换为 Excalidraw 元素
 */
export async function convertMermaidToExcalidraw(
  mermaidCode: string,
  options: MermaidConversionOptions = {},
): Promise<MermaidConversionResult> {
  const { fontSize = "16px" } = options;

  // 解析 Mermaid 代码为骨架格式
  const { elements, files } = await parseMermaidToExcalidraw(mermaidCode, {
    themeVariables: { fontSize },
  });

  // 转换为完整的 Excalidraw 元素
  const excalidrawElements = convertToExcalidrawElements(elements);

  return {
    elements: excalidrawElements,
    files: files || {},
  };
}

/**
 * 从文本中提取 Mermaid 代码块
 */
export function extractMermaidFromText(text: string): string | null {
  const regex = /```mermaid\n([\s\S]*?)\n```/g;
  const match = regex.exec(text);
  return match ? match[1].trim() : null;
}

/**
 * 检查文本是否包含 Mermaid 代码块
 */
export function hasMermaidCode(text: string): boolean {
  return /```mermaid\n[\s\S]*?\n```/.test(text);
}

/**
 * 将 Mermaid 代码转换并插入到当前 Excalidraw 画布
 */
export async function insertMermaidToCanvas(
  mermaidCode: string,
): Promise<boolean> {
  const api = getGlobalExcalidrawAPI();
  if (!api) {
    console.error("Excalidraw API not available");
    return false;
  }

  try {
    // 转换 Mermaid 为 Excalidraw 元素
    const { elements: newElements, files: newFiles } =
      await convertMermaidToExcalidraw(mermaidCode);

    // 获取当前场景元素
    const currentElements = api.getSceneElements() || [];

    // 计算新元素的偏移量，避免与现有元素重叠
    const offset = calculateOffset(currentElements);

    // 为新元素添加偏移
    const offsetElements = newElements.map((el: any) => ({
      ...el,
      x: (el.x || 0) + offset.x,
      y: (el.y || 0) + offset.y,
    }));

    // 更新场景
    api.updateScene({
      elements: [...currentElements, ...offsetElements],
    });

    // 如果有文件（如图片），也添加进去
    if (Object.keys(newFiles).length > 0) {
      api.addFiles(Object.values(newFiles));
    }

    // 滚动到新添加的元素
    setTimeout(() => {
      api.scrollToContent(offsetElements, {
        fitToContent: true,
        animate: true,
      });
    }, 100);

    return true;
  } catch (error) {
    console.error("Failed to insert Mermaid to canvas:", error);
    return false;
  }
}

/**
 * 计算新元素的偏移量
 */
function calculateOffset(existingElements: any[]): { x: number; y: number } {
  if (existingElements.length === 0) {
    return { x: 0, y: 0 };
  }

  // 找到现有元素的边界
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of existingElements) {
    const right = (el.x || 0) + (el.width || 0);
    const bottom = (el.y || 0) + (el.height || 0);
    maxX = Math.max(maxX, right);
    maxY = Math.max(maxY, bottom);
  }

  // 在现有元素右下方添加一些间距
  return {
    x: maxX + 100,
    y: 0,
  };
}
