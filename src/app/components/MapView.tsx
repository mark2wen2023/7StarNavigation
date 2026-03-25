import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import { Icon, LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Anchor,
  Bridge,
  Ship,
  AlertTriangle,
  Waves,
  Droplets,
  Construction,
  Map,
} from "lucide-react";

/* ─── Types ─── */
interface NavigationElement {
  id: string;
  name: string;
  type: string;
  subType?: string;
  km?: string;
  note?: string;
  riskLevel?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  params?: Record<string, any>;
}

interface WaypointData {
  label: string;
  type?: string;
  note?: string;
  latitude?: number;
  longitude?: number;
}

interface MapViewProps {
  elements?: NavigationElement[];
  waypoints?: WaypointData[];
  routeLine?: LatLngExpression[];
  highlightedElement?: string;
}

/* ─── 地图中心调整组件 ─── */
function MapUpdater({
  center,
  zoom,
}: {
  center: LatLngExpression;
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

/* ─── 自定义图标配置 ─── */
const createCustomIcon = (color: string, symbol: string) => {
  const svgIcon = `
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26C32 7.163 24.837 0 16 0z" fill="${color}"/>
      <circle cx="16" cy="16" r="8" fill="white"/>
      <text x="16" y="21" text-anchor="middle" font-size="14" font-weight="bold" fill="${color}">${symbol}</text>
    </svg>
  `;
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
};

const typeIconConfig: Record<
  string,
  { color: string; symbol: string }
> = {
  桥梁: { color: "#1677ff", symbol: "🌉" },
  渡口: { color: "#52c41a", symbol: "⛴️" },
  码头: { color: "#722ed1", symbol: "🚢" },
  取水口: { color: "#13c2c2", symbol: "💧" },
  锚泊区: { color: "#fa8c16", symbol: "⚓" },
  商渔密集区: { color: "#eb2f96", symbol: "🎣" },
  横越区: { color: "#faad14", symbol: "⚠️" },
  水工水域: { color: "#1890ff", symbol: "🏗️" },
  default: { color: "#8c8c8c", symbol: "📍" },
};

/* ─── 主地图组件 ─── */
export function MapView({
  elements = [],
  waypoints = [],
  routeLine = [],
  highlightedElement,
}: MapViewProps) {
  const [mapElements, setMapElements] = useState<
    NavigationElement[]
  >([]);
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([
    23.05, 112.45,
  ]); // 默认肇庆-广州区域
  const [mapZoom, setMapZoom] = useState(10);

  // 从 localStorage 加载通航要素
  useEffect(() => {
    if (elements.length > 0) {
      setMapElements(elements);
    } else {
      const stored = localStorage.getItem("navigationElements");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const withCoords = parsed.filter(
            (el: NavigationElement) =>
              el.latitude &&
              el.longitude &&
              typeof el.latitude === "number" &&
              typeof el.longitude === "number" &&
              !isNaN(el.latitude) &&
              !isNaN(el.longitude),
          );
          setMapElements(withCoords);

          if (withCoords.length === 0) {
            console.warn(
              "⚠️ 未找到包含有效经纬度坐标的通航要素数据",
            );
          }
        } catch (e) {
          console.error(
            "Failed to parse navigation elements:",
            e,
          );
        }
      }
    }
  }, [elements]);

  // 如果有航线数据，调整地图中心
  useEffect(() => {
    if (routeLine.length > 0) {
      const lats = routeLine.map((p) => (p as number[])[0]);
      const lngs = routeLine.map((p) => (p as number[])[1]);
      const centerLat =
        (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng =
        (Math.min(...lngs) + Math.max(...lngs)) / 2;
      setMapCenter([centerLat, centerLng]);
      setMapZoom(11);
    } else if (mapElements.length > 0) {
      // 根据要素计算中心
      const validElements = mapElements.filter(
        (el) => el.latitude && el.longitude,
      );
      if (validElements.length > 0) {
        const avgLat =
          validElements.reduce(
            (sum, el) => sum + (el.latitude || 0),
            0,
          ) / validElements.length;
        const avgLng =
          validElements.reduce(
            (sum, el) => sum + (el.longitude || 0),
            0,
          ) / validElements.length;
        setMapCenter([avgLat, avgLng]);
      }
    }
  }, [routeLine, mapElements]);

  return (
    <div className="w-full h-full relative">
      {mapElements.length === 0 ? (
        /* 空状态提示 */
        <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Map size={40} className="text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              暂无地图数据
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              请先访问海事端后台{" "}
              <span className="font-mono text-blue-600">
                /admin
              </span>
            </p>
            <p className="text-xs text-gray-400">
              在「通航要素」模块初始化数据，
              <br />
              确保数据包含经纬度坐标信息
            </p>
          </div>
        </div>
      ) : (
        <>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="w-full h-full rounded-xl"
            scrollWheelZoom={true}
          >
            <MapUpdater center={mapCenter} zoom={mapZoom} />

            {/* 地图底图 - 使用 OpenStreetMap */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* 绘制航线 */}
            {routeLine.length > 0 && (
              <Polyline
                positions={routeLine}
                color="#1677ff"
                weight={4}
                opacity={0.7}
                dashArray="10, 10"
              />
            )}

            {/* 标注通航要素 */}
            {mapElements.map((element) => {
              if (!element.latitude || !element.longitude)
                return null;

              const config =
                typeIconConfig[element.type] ||
                typeIconConfig.default;
              const icon = createCustomIcon(
                config.color,
                config.symbol,
              );
              const isHighlighted =
                highlightedElement === element.id;

              return (
                <Marker
                  key={element.id}
                  position={[
                    element.latitude,
                    element.longitude,
                  ]}
                  icon={icon}
                  opacity={isHighlighted ? 1 : 0.85}
                >
                  <Popup className="custom-popup">
                    <div className="p-2 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                          style={{
                            backgroundColor:
                              config.color + "20",
                            color: config.color,
                          }}
                        >
                          {config.symbol}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-900">
                            {element.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {element.type}
                          </p>
                        </div>
                      </div>

                      {element.km && (
                        <div className="text-xs text-gray-600 mb-1">
                          📍 {element.km}
                        </div>
                      )}

                      {element.riskLevel && (
                        <div
                          className={`text-xs inline-block px-2 py-0.5 rounded-full mb-2 ${
                            element.riskLevel === "高"
                              ? "bg-red-100 text-red-700"
                              : element.riskLevel === "中"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          风险等级: {element.riskLevel}
                        </div>
                      )}

                      {element.note && (
                        <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
                          {element.note}
                        </div>
                      )}

                      {element.params &&
                        Object.keys(element.params).length >
                          0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                            {Object.entries(element.params).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="text-xs text-gray-600"
                                >
                                  <span className="font-medium">
                                    {key}:
                                  </span>{" "}
                                  {value as string}
                                </div>
                              ),
                            )}
                          </div>
                        )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* 标注航路点 */}
            {waypoints.map((wp, index) => {
              if (!wp.latitude || !wp.longitude) return null;

              const icon = createCustomIcon(
                "#52c41a",
                (index + 1).toString(),
              );

              return (
                <Marker
                  key={`waypoint-${index}`}
                  position={[wp.latitude, wp.longitude]}
                  icon={icon}
                >
                  <Popup>
                    <div className="p-2">
                      <p className="font-semibold text-sm">
                        {wp.label}
                      </p>
                      {wp.type && (
                        <p className="text-xs text-gray-500">
                          {wp.type}
                        </p>
                      )}
                      {wp.note && (
                        <p className="text-xs text-gray-600 mt-1">
                          {wp.note}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* 图例 */}
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 z-[1000]">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              图例
            </p>
            <div className="space-y-1">
              {Object.entries(typeIconConfig)
                .slice(0, -1)
                .map(([type, config]) => (
                  <div
                    key={type}
                    className="flex items-center gap-2"
                  >
                    <span className="text-base">
                      {config.symbol}
                    </span>
                    <span className="text-xs text-gray-600">
                      {type}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* 统计信息 */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 z-[1000]">
            <p className="text-xs font-semibold text-gray-700 mb-1">
              数据统计
            </p>
            <p className="text-xs text-gray-600">
              通航要素:{" "}
              <span className="font-semibold text-blue-600">
                {mapElements.length}
              </span>{" "}
              处
            </p>
            {waypoints.length > 0 && (
              <p className="text-xs text-gray-600">
                航路点:{" "}
                <span className="font-semibold text-green-600">
                  {waypoints.length}
                </span>{" "}
                个
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}