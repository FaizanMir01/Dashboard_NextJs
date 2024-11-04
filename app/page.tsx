'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as am5 from '@amcharts/amcharts5'
import * as am5map from '@amcharts/amcharts5/map'
import * as am5xy from '@amcharts/amcharts5/xy'
import * as am5percent from '@amcharts/amcharts5/percent'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import indiaLow from '@amcharts/amcharts5-geodata/indiaLow'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, ChevronsUpDown } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

// Import the JSON data
import salesData from '@/data/sales_data.json'

interface SaleData {
  paymentId: number;
  outletId: number;
  saleDate: string;
  saleTime: string;
  product: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  discount: number;
  subzone: string;
}

export default function Dashboard() {
  const [data, setData] = useState<SaleData[]>([])
  const [filteredData, setFilteredData] = useState<SaleData[]>([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedZones, setSelectedZones] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("dashboard")
  const chartRefs = {
    map: useRef<HTMLDivElement>(null),
    timewiseSales: useRef<HTMLDivElement>(null),
    productDiscountwise: useRef<HTMLDivElement>(null),
    productwiseQty: useRef<HTMLDivElement>(null),
    productwiseDiscount: useRef<HTMLDivElement>(null),
    salesAvg: useRef<HTMLDivElement>(null),
    discountAvg: useRef<HTMLDivElement>(null),
    quantityAvg: useRef<HTMLDivElement>(null),
    reportProductwiseQty: useRef<HTMLDivElement>(null),
    reportProductwiseDiscount: useRef<HTMLDivElement>(null),
    reportProductDiscountwise: useRef<HTMLDivElement>(null),
  }
  const chartRoots = useRef<{ [key: string]: am5.Root | null }>({})

  useEffect(() => {
    setData(salesData as SaleData[])
    setFilteredData(salesData as SaleData[])
  }, [])

  useEffect(() => {
    if (filteredData.length === 0) return;

    Object.entries(chartRefs).forEach(([key, ref]) => {
      if (ref.current) {
        if (chartRoots.current[key]) {
          chartRoots.current[key]!.dispose()
        }
        
        chartRoots.current[key] = am5.Root.new(ref.current)
        chartRoots.current[key]!.setThemes([am5themes_Animated.new(chartRoots.current[key]!)])

        switch (key) {
          case 'map':
            createIndiaMap(chartRoots.current[key]!, filteredData)
            break
          case 'timewiseSales':
            createTimewiseSalesChart(chartRoots.current[key]!, filteredData)
            break
          case 'productDiscountwise':
          case 'reportProductDiscountwise':
            createProductDiscountwiseChart(chartRoots.current[key]!, filteredData)
            break
          case 'productwiseQty':
          case 'reportProductwiseQty':
            createProductwiseQtyChart(chartRoots.current[key]!, filteredData)
            break
          case 'productwiseDiscount':
          case 'reportProductwiseDiscount':
            createProductwiseDiscountChart(chartRoots.current[key]!, filteredData)
            break
          case 'salesAvg':
            createGaugeChart(chartRoots.current[key]!, 'Sales Avg', calculateAverage(filteredData, 'amount'), Math.max(...filteredData.map(item => item.amount)))
            break
          case 'discountAvg':
            createGaugeChart(chartRoots.current[key]!, 'Discount Avg', calculateAverage(filteredData, 'discount'), Math.max(...filteredData.map(item => item.discount)))
            break
          case 'quantityAvg':
            createGaugeChart(chartRoots.current[key]!, 'Quantity Avg', calculateAverage(filteredData, 'quantity'), Math.max(...filteredData.map(item => item.quantity)))
            break
        }
      }
    })

    return () => {
      Object.values(chartRoots.current).forEach(root => {
        if (root) {
          root.dispose()
        }
      })
      chartRoots.current = {}
    }
  }, [filteredData, activeTab])

  const calculateAverage = (data: SaleData[], field: keyof SaleData) => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + Number(item[field]), 0);
    return Number((sum / data.length).toFixed(2));
  };

  const totalSales = filteredData.reduce((acc, item) => acc + item.amount, 0)
  const totalDiscount = filteredData.reduce((acc, item) => acc + item.discount, 0)
  const totalQuantity = filteredData.reduce((acc, item) => acc + item.quantity, 0)

  const handleFilter = () => {
    let filtered = data;

    if (fromDate) {
      filtered = filtered.filter(item => new Date(item.saleDate) >= new Date(fromDate));
    }

    if (toDate) {
      filtered = filtered.filter(item => new Date(item.saleDate) <= new Date(toDate));
    }

    if (selectedProducts.length > 0) {
      filtered = filtered.filter(item => selectedProducts.includes(item.product));
    }

    if (selectedZones.length > 0) {
      filtered = filtered.filter(item => selectedZones.includes(item.subzone));
    }

    setFilteredData(filtered);
  }

  const MultiSelect = ({ options, selected, setSelected, placeholder }: {
    options: string[],
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
    placeholder: string
  }) => {
    const [open, setOpen] = useState(false)

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selected.length > 0
              ? `${selected.length} selected`
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <div className="max-h-60 overflow-auto p-1">
            {options.map((option) => (
              <div key={option} className="flex items-center space-x-2 p-2">
                <Checkbox
                  id={option}
                  checked={selected.includes(option)}
                  onCheckedChange={(checked) => {
                    setSelected(
                      checked
                        ? [...selected, option]
                        : selected.filter((item) => item !== option)
                    )
                  }}
                />
                <label
                  htmlFor={option}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  const FilterPanel = () => {
    const products = Array.from(new Set(data.map(item => item.product)));
    const zones = Array.from(new Set(data.map(item => item.subzone)));

    return (
      <Card className="">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">From Date</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">To Date</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Products</label>
            <MultiSelect
              options={products}
              selected={selectedProducts}
              setSelected={setSelectedProducts}
              placeholder="Select products..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Zones</label>
            <MultiSelect
              options={zones}
              selected={selectedZones}
              setSelected={setSelectedZones}
              placeholder="Select zones..."
            />
          </div>
          <Button className="w-full" onClick={handleFilter}>Apply Filters</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="px-2 py-4">
      <h1 className="text-3xl font-bold mb-8">Sales Dashboard</h1>
      <Tabs defaultValue="dashboard" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>India Map</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div ref={chartRefs.map} style={{ width: '100%', height: '400px' }}></div>
                  </CardContent>
                </Card>
                <Card className='col-span-2'>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Sales</h3>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-2xl font-bold">{totalSales.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-muted h-4 rounded-full">
                        <div className="bg-primary h-4 rounded-full" style={{ width: `${(totalSales / (totalSales * 1.5)) * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Discount</h3>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-2xl font-bold">{totalDiscount.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-muted h-4 rounded-full">
                        <div className="bg-primary h-4 rounded-full" style={{ width: `${(totalDiscount / totalSales) * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Quantity</h3>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-2xl font-bold">{totalQuantity}</span>
                      </div>
                      <div className="w-full bg-muted h-4 rounded-full">
                        <div className="bg-primary h-4 rounded-full" style={{ width: `${(totalQuantity / (totalQuantity * 1.5)) * 100}%` }}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Timewise Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div ref={chartRefs.timewiseSales} style={{ width: '100%', height: '300px' }}></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Product Discountwise Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div ref={chartRefs.productDiscountwise} style={{ width: '100%', height: '300px' }}></div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Productwise Quantity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div ref={chartRefs.productwiseQty} style={{ width: '100%', height: '300px' }}></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Productwise Discount</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div ref={chartRefs.productwiseDiscount} style={{ width: '100%', height: '300px' }}></div>
                  
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Sales Average</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div ref={chartRefs.salesAvg} style={{ width: '100%', height: '200px' }}></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Discount Average</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div ref={chartRefs.discountAvg} style={{ width: '100%', height: '200px' }}></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Quantity Average</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div ref={chartRefs.quantityAvg} style={{ width: '100%', height: '200px' }}></div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <FilterPanel />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="report">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payment ID</TableHead>
                          <TableHead>Outlet ID</TableHead>
                          <TableHead>Sale Date</TableHead>
                          <TableHead>Sale Time</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead>Subzone</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.paymentId}</TableCell>
                            <TableCell>{item.outletId}</TableCell>
                            <TableCell>{item.saleDate}</TableCell>
                            <TableCell>{item.saleTime}</TableCell>
                            <TableCell>{item.product}</TableCell>
                            <TableCell>{item.sku}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell>${item.amount.toFixed(2)}</TableCell>
                            <TableCell>${item.discount.toFixed(2)}</TableCell>
                            <TableCell>{item.subzone}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Productwise Quantity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div ref={chartRefs.reportProductwiseQty} style={{ width: '100%', height: '300px' }}></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Productwise Discount</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div ref={chartRefs.reportProductwiseDiscount} style={{ width: '100%', height: '300px' }}></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Product Discount Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div ref={chartRefs.reportProductDiscountwise} style={{ width: '100%', height: '300px' }}></div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <FilterPanel />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function createIndiaMap(root: am5.Root, data: SaleData[]) {
  const chart = root.container.children.push(
    am5map.MapChart.new(root, {
      panX: "translateX",
      panY: "translateY",
      projection: am5map.geoMercator()
    })
  );

  const polygonSeries = chart.series.push(
    am5map.MapPolygonSeries.new(root, {
      geoJSON: indiaLow,
      valueField: "value",
      calculateAggregates: true
    })
  );

  const subzoneData = data.reduce((acc: { [key: string]: number }, item) => {
    acc[item.subzone] = (acc[item.subzone] || 0) + item.amount;
    return acc;
  }, {});

  polygonSeries.data.setAll(
    Object.entries(subzoneData).map(([subzone, amount]) => ({
      id: subzone,
      value: amount
    }))
  );

  polygonSeries.set("heatRules", [{
    target: polygonSeries.mapPolygons.template,
    dataField: "value",
    min: am5.color(0xc7d2fe),
    max: am5.color(0x3730a3),
    key: "fill"
  }]);

  chart.set("zoomControl", am5map.ZoomControl.new(root, {}));
  chart.chartContainer.set("background", am5.Rectangle.new(root, {
    fill: am5.color(0xffffff),
    fillOpacity: 1
  }));
  chart.series.push(polygonSeries);

  polygonSeries.mapPolygons.template.setAll({
    tooltipText: "{name}: {value}"
  });

  polygonSeries.mapPolygons.template.states.create("hover", {
    fill: am5.color(0x297fb8)
  });
}

function createTimewiseSalesChart(root: am5.Root, data: SaleData[]) {
  const chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panX: true,
      panY: true,
      wheelX: "panX",
      wheelY: "zoomX"
    })
  );

  const xAxis = chart.xAxes.push(
    am5xy.DateAxis.new(root, {
      baseInterval: { timeUnit: "hour", count: 1 },
      renderer: am5xy.AxisRendererX.new(root, {}),
      tooltip: am5.Tooltip.new(root, {})
    })
  );

  const yAxis = chart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {})
    })
  );

  const series = chart.series.push(
    am5xy.LineSeries.new(root, {
      name: "Sales",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "amount",
      valueXField: "date",
      tooltip: am5.Tooltip.new(root, {
        labelText: "${valueY}"
      })
    })
  );

  const processedData = data.map(item => ({
    date: new Date(`${item.saleDate} ${item.saleTime}`).getTime(),
    amount: item.amount
  })).sort((a, b) => a.date - b.date);

  series.data.setAll(processedData);
  chart.set("cursor", am5xy.XYCursor.new(root, {}));
}

function createProductDiscountwiseChart(root: am5.Root, data: SaleData[]) {
  const chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panX: true,
      panY: true,
      wheelX: "panX",
      wheelY: "zoomX",
    })
  );

  const xAxis = chart.xAxes.push(
    am5xy.CategoryAxis.new(root, {
      categoryField: "product",
      renderer: am5xy.AxisRendererX.new(root, {
        minGridDistance: 30
      }),
      tooltip: am5.Tooltip.new(root, {})
    })
  );

  const yAxis = chart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {})
    })
  );

  const series = chart.series.push(
    am5xy.ColumnSeries.new(root, {
      name: "Discount",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "discount",
      categoryXField: "product",
      tooltip: am5.Tooltip.new(root, {
        labelText: "${valueY}"
      })
    })
  );

  const processedData = Object.entries(
    data.reduce((acc: { [key: string]: number }, item) => {
      acc[item.product] = (acc[item.product] || 0) + item.discount;
      return acc;
    }, {})
  ).map(([product, discount]) => ({ product, discount }));

  xAxis.data.setAll(processedData);
  series.data.setAll(processedData);
  xAxis.get("renderer").labels.template.setAll({
    oversizedBehavior: "wrap",
    maxWidth: 150,
    rotation: -45,
    centerY: am5.p50,
    centerX: am5.p100,
    paddingRight: 15
  });
  chart.set("cursor", am5xy.XYCursor.new(root, {}));
}

function createProductwiseQtyChart(root: am5.Root, data: SaleData[]) {
  const chart = root.container.children.push(
    am5percent.PieChart.new(root, {
      radius: am5.percent(90),
      innerRadius: am5.percent(50)
    })
  );

  const series = chart.series.push(
    am5percent.PieSeries.new(root, {
      name: "Quantity",
      valueField: "quantity",
      categoryField: "product",
      tooltip: am5.Tooltip.new(root, {
        labelText: "{category}: {value}"
      })
    })
  );

  const processedData = Object.entries(
    data.reduce((acc: { [key: string]: number }, item) => {
      acc[item.product] = (acc[item.product] || 0) + item.quantity;
      return acc;
    }, {})
  ).map(([product, quantity]) => ({ product, quantity }));

  series.data.setAll(processedData);
}

function createProductwiseDiscountChart(root: am5.Root, data: SaleData[]) {
  const chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panY: true,
      wheelY: "zoomY",
      layout: root.verticalLayout,
      maxTooltipDistance: 0
    })
  );

  const xAxis = chart.xAxes.push(
    am5xy.CategoryAxis.new(root, {
      categoryField: "product",
      renderer: am5xy.AxisRendererX.new(root, {
        minGridDistance: 30,
        cellStartLocation: 0.1,
        cellEndLocation: 0.9
      }),
      tooltip: am5.Tooltip.new(root, {})
    })
  );

  const yAxis = chart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {})
    })
  );

  const series = chart.series.push(
    am5xy.ColumnSeries.new(root, {
      name: "Discount",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "discount",
      categoryXField: "product",
      tooltip: am5.Tooltip.new(root, {
        labelText: "Discount: ${valueY}"
      })
    })
  );

  const processedData = Object.entries(
    data.reduce((acc: { [key: string]: number }, item) => {
      acc[item.product] = (acc[item.product] || 0) + item.discount;
      return acc;
    }, {})
  )
    .map(([product, discount]) => ({ 
      product, 
      discount: Number(discount.toFixed(2))
    }))
    .sort((a, b) => b.discount - a.discount);

  xAxis.data.setAll(processedData);
  series.data.setAll(processedData);

  chart.set("cursor", am5xy.XYCursor.new(root, {
    behavior: "none",
    xAxis: xAxis,
    yAxis: yAxis
  }));

  xAxis.get("renderer").labels.template.setAll({
    oversizedBehavior: "wrap",
    maxWidth: 150,
    rotation: -45,
    centerY: am5.p50,
    centerX: am5.p100,
    paddingRight: 15
  });
}

function createGaugeChart(root: am5.Root, title: string, value: number, max: number) {
  // Create chart
  const chart = root.container.children.push(
    am5percent.PieChart.new(root, {
      startAngle: 180,
      endAngle: 360,
      layout: root.verticalLayout,
      innerRadius: am5.percent(80)
    })
  );

  // Create series
  const series = chart.series.push(
    am5percent.PieSeries.new(root, {
      valueField: "value",
      categoryField: "category",
      startAngle: 180,
      endAngle: 360
    })
  );

  // Customize hidden state
  series.states.create("hidden", {
    startAngle: 180,
    endAngle: 180
  });

  series.slices.template.setAll({
    cornerRadius: 5
  });

  // Hide category labels for "Main" and "Rest"
  series.labels.template.setAll({
    forceHidden: true
  });

  series.ticks.template.setAll({
    forceHidden: true
  });

  // Set custom colors for the gauge
  series.get("colors")?.set("colors", [
    am5.color(0x2196F3),  // Main value color
    am5.color(0xEEEEEE)   // Background color
  ]);

  // Add label to show the main value
  const valueLabel = chart.seriesContainer.children.push(
    am5.Label.new(root, {
      textAlign: "center",
      centerY: am5.percent(50),
      centerX: am5.percent(50),
      text: value.toFixed(1),
      fontSize: 24,
      fontWeight: "bold",
      fill: am5.color(0x2196F3)  // Match the color of the main gauge
    })
  );

  // Set data
  series.data.setAll([
    {
      category: "Main",
      value: value
    },
    {
      category: "Rest",
      value: max - value
    }
  ]);

  // Create title label
  chart.children.unshift(
    am5.Label.new(root, {
      text: title,
      fontSize: 14,
      fontWeight: "500",
      textAlign: "center",
      x: am5.percent(50),
      centerX: am5.percent(50),
      paddingTop: 0,
      paddingBottom: 10
    })
  );

  // Animate series on load
  series.appear(1000, 100);

  return chart;
}
