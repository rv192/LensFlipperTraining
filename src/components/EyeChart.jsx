import React from 'react';
import { DIRECTIONS, FONT_SIZE_CONFIG } from '../utils/constants';
import { getGridConfig, useResponsiveGrid, getViewportInfo, isMobileDevice } from '../utils/responsive';
import './EyeChart.css';

const EyeChart = ({ currentCell, onCellClick, isTraining, cellError, fontSize = 'medium', onCellDirectionReady }) => {
  // 生成随机的E字母方向
  const generateRandomDirection = () => {
    const directions = Object.values(DIRECTIONS);
    return directions[Math.floor(Math.random() * directions.length)];
  };

  // 生成网格数据
  const generateGrid = (gridConfig = null) => {
    const config = gridConfig || getGridConfig();
    const grid = [];
    for (let row = 0; row < config.rows; row++) {
      const rowData = [];
      for (let col = 0; col < config.cols; col++) {
        rowData.push({
          id: `${row}-${col}`,
          row,
          col,
          direction: generateRandomDirection()
        });
      }
      grid.push(rowData);
    }
    return grid;
  };

  const [grid, setGrid] = React.useState(() => generateGrid());
  const [gridConfig, setGridConfig] = React.useState(() => getGridConfig());

  // 获取指定格子的方向
  const getCellDirection = React.useCallback((cellId) => {
    console.log(`🔍 getCellDirection 被调用，查找格子: ${cellId}`);
    console.log(`🔍 当前网格大小: ${grid.length} 行`);

    for (const row of grid) {
      for (const cell of row) {
        if (cell.id === cellId) {
          console.log(`✅ 找到格子 ${cellId}，方向: ${cell.direction}`);
          return cell.direction;
        }
      }
    }

    console.error(`❌ 未找到格子 ${cellId}`);
    console.error(`❌ 可用的格子ID:`, grid.flat().map(cell => cell.id));
    return null;
  }, [grid]);

  // 监听屏幕大小变化
  React.useEffect(() => {
    const viewportInfo = getViewportInfo();
    console.log('EyeChart 初始化');
    console.log('屏幕信息:', viewportInfo);
    console.log('当前网格配置:', gridConfig);

    const cleanup = useResponsiveGrid((newConfig) => {
      const newViewportInfo = getViewportInfo();
      console.log('屏幕大小变化');
      console.log('新屏幕信息:', newViewportInfo);
      console.log('新网格配置:', newConfig);
      setGridConfig(newConfig);
      setGrid(generateGrid(newConfig));
    });

    return cleanup;
  }, []);

  // 当组件挂载时，将getCellDirection函数传递给父组件
  React.useEffect(() => {
    if (onCellDirectionReady) {
      onCellDirectionReady(getCellDirection);
    }
  }, [getCellDirection, onCellDirectionReady]);

  // 渲染E字母
  const renderE = (direction) => {
    // 获取当前字体大小配置
    const fontConfig = FONT_SIZE_CONFIG[fontSize];
    const isMobile = isMobileDevice();
    const customFontSize = isMobile ? fontConfig.mobile : fontConfig.desktop;

    // 使用统一的E字符，通过CSS旋转来实现不同方向
    return (
      <div className="cell-content">
        <span
          className={`e-letter direction-${direction}`}
          style={{
            fontSize: customFontSize,
            transform: `rotate(${getRotationAngle(direction)}) scale(${fontConfig.scale})`
          }}
        >
          E
        </span>
        <span className="direction-debug">
          {direction}
        </span>
      </div>
    );
  };

  // 获取旋转角度
  const getRotationAngle = (direction) => {
    switch (direction) {
      case 'up': return '-90deg';
      case 'down': return '90deg';
      case 'left': return '0deg';
      case 'right': return '180deg';
      default: return '0deg';
    }
  };

  return (
    <div className="eye-chart">
      {/* 调试信息 - 仅在开发环境显示 */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '5px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          zIndex: 1000,
          fontFamily: 'monospace'
        }}>
          {gridConfig.rows}×{gridConfig.cols} | {getViewportInfo().screenSize} | {window.innerWidth}×{window.innerHeight}
        </div>
      )}

      <div className="grid-container">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="grid-row">
            {row.map((cell) => (
              <div
                key={cell.id}
                className={`grid-cell ${
                  currentCell && currentCell.id === cell.id ? 'active' : ''
                } ${isTraining ? 'training-mode' : ''} ${
                  cellError && currentCell && currentCell.id === cell.id ? 'error' : ''
                }`}
                onClick={() => onCellClick && onCellClick(cell)}
                data-direction={cell.direction}
              >
                {renderE(cell.direction)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EyeChart;
