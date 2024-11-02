"use client"

import React, { useEffect, useRef, useState } from 'react'
import * as am5 from '@amcharts/amcharts5'
import * as am5map from '@amcharts/amcharts5/map'
import * as am5xy from '@amcharts/amcharts5/xy'
import * as am5percent from '@amcharts/amcharts5/percent'
import * as am5radar from '@amcharts/amcharts5/radar'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import indiaLow from '@amcharts/amcharts5-geodata/indiaLow'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Import the JSON data
import salesData from '@/data/sales_data.json'

interface SaleData {
  paymentId: string;
  outletId: string;
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
  const chartRefs = {
    map: useRef<HTMLDivElement>(null),
    timewiseSales: useRef<HTMLDivElement>(null),
    productDiscountwise: useRef<HTMLDivElement>(null),
    productwiseQty: useRef<HTMLDivElement>(null),
    productwiseDiscount: useRef<HTMLDivElement>(null),
    salesAvg: useRef<HTMLDivElement>(null),
    discountAvg: useRef<HTMLDivElement>(null),
    quantityAvg: useRef<HTMLDivElement>(null),
    
  }

  useEffect(() => {
    setData(salesData as SaleData[])
  }, [])

useEffect(() => {
    if (data.length === 0 || Object.values(chartRefs).some(ref => !ref.current)) return;
  
    const roots = Object.fromEntries(
      Object.entries(chartRefs).map(([key, ref]) => [
        key,
        am5.Root.new(ref.current!),
      ])
    );
  
    Object.values(roots).forEach((root) => {
      root.setThemes([am5themes_Animated.new(root)]);
    });
  
    // Calculate averages and maximums for gauge charts
    const salesAvg = calculateAverage(data, 'amount');
    const discountAvg = calculateAverage(data, 'discount');
    const quantityAvg = calculateAverage(data, 'quantity');

    const maxSales = Math.max(...data.map(item => item.amount));
    const maxDiscount = Math.max(...data.map(item => item.discount));
    const maxQuantity = Math.max(...data.map(item => item.quantity));

    createIndiaMap(roots.map, data);
    createTimewiseSalesChart(roots.timewiseSales, data);
    createProductDiscountwiseChart(roots.productDiscountwise, data);
    createProductwiseQtyChart(roots.productwiseQty, data);
    createProductwiseDiscountChart(roots.productwiseDiscount, data);
    
    // Create gauge charts with appropriate maximums
    createGaugeChart(roots.salesAvg, 'Sales Avg', salesAvg, maxSales);
    createGaugeChart(roots.discountAvg, 'Discount Avg', discountAvg, maxDiscount);
    createGaugeChart(roots.quantityAvg, 'Quantity Avg', quantityAvg, maxQuantity);
  
    return () => {
      Object.values(roots).forEach((root) => root.dispose());
    };
  }, [data]);

  const calculateAverage = (data: SaleData[], field: keyof SaleData) => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + Number(item[field]), 0);
    return Number((sum / data.length).toFixed(2));
  };
  const totalSales = data.reduce((acc, item) => acc + item.amount, 0)
  const totalDiscount = data.reduce((acc, item) => acc + item.discount, 0)
  const totalQuantity = data.reduce((acc, item) => acc + item.quantity, 0)

  const FilterPanel = () => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">From Datetime</label>
          <Input type="datetime-local" className="w-full" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">To Datetime</label>
          <Input type="datetime-local" className="w-full" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Product</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select Product" />
            </SelectTrigger>
            <SelectContent>
              {Array.from(new Set(data.map(item => item.product))).map(product => (
                <SelectItem key={product} value={product}>{product}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Zone</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select Subzone" />
            </SelectTrigger>
            <SelectContent>
              {Array.from(new Set(data.map(item => item.subzone))).map(subzone => (
                <SelectItem key={subzone} value={subzone}>{subzone}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button className="w-full">Search</Button>
      </CardContent>
    </Card>
  )

  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="report">Report</TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 space-y-4">
            

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>India Map</CardTitle>
                </CardHeader>
                <CardContent>
                  <div ref={chartRefs.map} style={{ width: '100%', height: '400px' }}></div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 col-span-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Timewise Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div ref={chartRefs.timewiseSales} style={{ width: '100%', height: '200px' }}></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Product discountwise sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div ref={chartRefs.productDiscountwise} style={{ width: '100%', height: '200px' }}></div>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-1 col-span-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span>Sales</span>
                    <span className="text-2xl font-bold">{totalSales.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-muted h-4 rounded-full">
                    <div className="bg-[#2e91e2] h-4  rounded-full" style={{ width: `${(totalSales / (totalSales * 1.5)) * 100}%` }}></div>
                  </div>
                </CardContent>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span>Discount</span>
                    <span className="text-2xl font-bold">{totalDiscount.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-muted h-4 rounded-full">
                    <div className="bg-[#2e91e2] h-4 rounded-full" style={{ width: `${(totalDiscount / totalSales) * 100}%` }}></div>
                  </div>
                </CardContent>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span>Qty</span>
                    <span className="text-2xl font-bold">{totalQuantity}</span>
                  </div>
                  <div className="w-full bg-muted h-4 rounded-full">
                    <div className="bg-[#2e91e2] h-4 rounded-full" style={{ width: `${(totalQuantity / (totalQuantity * 1.5)) * 100}%` }}></div>
                  </div>
                </CardContent>
              </Card>
            </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Productwise Qty</CardTitle>
                </CardHeader>
                <CardContent>
                  <div ref={chartRefs.productwiseQty} style={{ width: '100%', height: '200px' }}></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Productwise Discount</CardTitle>
                </CardHeader>
                <CardContent>
                  <div ref={chartRefs.productwiseDiscount} style={{ width: '100%', height: '200px' }}></div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Avg</CardTitle>
                </CardHeader>
                <CardContent>
                  <div ref={chartRefs.salesAvg} style={{ width: '100%', height: '150px' }}></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Discount Avg</CardTitle>
                </CardHeader>
                <CardContent>
                  <div ref={chartRefs.discountAvg} style={{ width: '100%', height: '150px' }}></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Quantity Avg</CardTitle>
                </CardHeader>
                <CardContent>
                  <div ref={chartRefs.quantityAvg} style={{ width: '100%', height: '150px' }}></div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="md:col-span-1">
            <FilterPanel />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="report">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Report</CardTitle>
              </CardHeader>
              <CardContent className="overflow-auto">
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
                    {data.map((item, index) => (
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
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Product Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ width: '100%', height: '200px' }}></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Product qty</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ width: '100%', height: '200px' }}></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Product wise discount</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ width: '100%', height: '200px' }}></div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="md:col-span-1">
            <FilterPanel />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

function createIndiaMap(root: am5.Root, data: SaleData[]) {
  const chart = root.container.children.push(
    am5map.MapChart.new(root, {
      panX: "translateX",
      panY: "translateY",
      wheelY: "zoom"
    })
  );

  // Create map polygon series
  const polygonSeries = chart.series.push(
    am5map.MapPolygonSeries.new(root, {
      geoJSON: indiaLow,
      fill: am5.color(0x67B7DC),
      stroke: am5.color(0xFFFFFF)
    })
  );

  // Add heat rules based on sales data
  const subzoneData = Object.entries(
    data.reduce((acc: { [key: string]: number }, item) => {
      acc[item.subzone] = (acc[item.subzone] || 0) + item.amount;
      return acc;
    }, {})
  ).map(([subzone, amount]) => ({ subzone, amount }));

  polygonSeries.set("heatRules", [{
    target: polygonSeries.mapPolygons.template,
    dataField: "value",
    min: am5.color(0x67B7DC),
    max: am5.color(0x0D47A1)
  }]);

  // Add hover state
  const polygonTemplate = polygonSeries.mapPolygons.template;
  polygonTemplate.states.create("hover", {
    fill: am5.color(0x297FB8)
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

  // Create axes
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

  // Create series
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

  // Process data
  const processedData = data.map(item => ({
    date: new Date(`${item.saleDate} ${item.saleTime}`).getTime(),
    amount: item.amount
  })).sort((a, b) => a.date - b.date);

  series.data.setAll(processedData);
}

function createProductDiscountwiseChart(root: am5.Root, data: SaleData[]) {
  const chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panX: true,
      panY: true,
      wheelX: "panX",
      wheelY: "zoomX"
    })
  );

  // Create axes
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

  // Create series
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

  // Process data
  const processedData = Object.entries(
    data.reduce((acc: { [key: string]: number }, item) => {
      acc[item.product] = (acc[item.product] || 0) + item.discount;
      return acc;
    }, {})
  ).map(([product, discount]) => ({ product, discount }));

  xAxis.data.setAll(processedData);
  series.data.setAll(processedData);
}

function createProductwiseQtyChart(root: am5.Root, data: SaleData[]) {
  const chart = root.container.children.push(
    am5percent.PieChart.new(root, {
      radius: am5.percent(90),
      innerRadius: am5.percent(50)
    })
  );

  // Create series
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

  // Process data
  const processedData = Object.entries(
    data.reduce((acc: { [key: string]: number }, item) => {
      acc[item.product] = (acc[item.product] || 0) + item.quantity;
      return acc;
    }, {})
  ).map(([product, quantity]) => ({ product, quantity }));

  series.data.setAll(processedData);
}

function createProductwiseDiscountChart(root: am5.Root, data: SaleData[]) {
  // Create chart
  const chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panY: true,
      wheelY: "zoomY",
      layout: root.verticalLayout,
      maxTooltipDistance: 0
    })
  );

  // Create X-axis (categories - products)
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

  // Create Y-axis (values - discount amounts)
  const yAxis = chart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {})
    })
  );

  // Create series
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

  // Style the bars
  series.columns.template.setAll({
    cornerRadiusTL: 3,
    cornerRadiusTR: 3,
    strokeOpacity: 0,
    fillGradient: am5.LinearGradient.new(root, {
      stops: [{
        color: am5.color(0x67B7DC)
      }, {
        color: am5.color(0x297FB8)
      }],
      rotation: 90
    })
  });

  // Prepare and set data
  const processedData = Object.entries(
    data.reduce((acc: { [key: string]: number }, item) => {
      acc[item.product] = (acc[item.product] || 0) + item.discount;
      return acc;
    }, {})
  )
    .map(([product, discount]) => ({ 
      product, 
      discount: Number(discount.toFixed(2))  // Round to 2 decimal places
    }))
    .sort((a, b) => b.discount - a.discount); // Sort by discount amount descending

  xAxis.data.setAll(processedData);
  series.data.setAll(processedData);

  // Add cursor
  chart.set("cursor", am5xy.XYCursor.new(root, {
    behavior: "none",
    xAxis: xAxis,
    yAxis: yAxis
  }));

  // Make stuff animate on load
  series.appear(1000);
  chart.appear(1000, 100);

  // Enable axis labels rotation if needed
  xAxis.get("renderer").labels.template.setAll({
    oversizedBehavior: "wrap",
    maxWidth: 150,
    rotation: -45,
    centerY: am5.p50,
    centerX: am5.p100,
    paddingRight: 15
  });

  return chart;
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
