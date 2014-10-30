define([
        "dojo/_base/declare",
		"framework/PluginBase",
		
		"esri/request",
		"esri/toolbars/draw",
		"esri/layers/ArcGISDynamicMapServiceLayer",
		"esri/layers/ArcGISTiledMapServiceLayer",
		"esri/layers/ArcGISImageServiceLayer",
		"esri/layers/ImageServiceParameters",
		"esri/layers/MosaicRule",
		"esri/layers/RasterFunction",
		"esri/tasks/ImageServiceIdentifyTask",
		"esri/tasks/ImageServiceIdentifyParameters",
		"esri/tasks/QueryTask",
		"esri/tasks/query",
		"esri/graphicsUtils",
		"esri/graphic",
		"esri/symbols/SimpleLineSymbol",
		"esri/symbols/SimpleFillSymbol",
		"esri/symbols/SimpleMarkerSymbol",
		"esri/geometry/Extent",
		"esri/geometry/Polygon",
		"esri/request",
		
		"dijit/registry",
		"dijit/form/Button",
		"dijit/form/DropDownButton",
		"dijit/DropDownMenu", 
		"dijit/MenuItem",
		"dijit/layout/ContentPane",
		"dijit/layout/TabContainer",
		"dijit/form/HorizontalSlider",
		"dijit/form/CheckBox",
		"dijit/form/RadioButton",
		"dojo/dom",
		"dojo/dom-class",
		"dojo/dom-style",
		"dojo/_base/window",
		"dojo/dom-construct",
		"dojo/dom-attr",
		"dojo/dom-geometry",
		"dijit/Dialog",
		
		"dojox/charting/Chart", 
		"dojox/charting/plot2d/Pie",
		"dojox/charting/action2d/Highlight",
        "dojox/charting/action2d/MoveSlice" , 
		"dojox/charting/action2d/Tooltip",
        "dojox/charting/themes/MiamiNice", 
		"dojox/charting/widget/Legend",
		
		"dojo/html",
		"dojo/_base/array",
		"dojo/aspect",
		"dojo/_base/lang",
		'dojo/_base/json',
		"dojo/on",
		"dojo/parser",
		"dojo/query",
		"dojo/NodeList-traverse",
		"require",
		"dojo/text!./config.json"
		
       ],
       function (declare, 
					PluginBase, 
					ESRIRequest,
					Drawer,
					ArcGISDynamicMapServiceLayer,
					ArcGISTiledMapServiceLayer,
					ArcGISImageServiceLayer,
					ImageServiceParameters,
					MosaicRule,
					RasterFunction,
					ImageServiceIdentifyTask,
					ImageServiceIdentifyParameters,
					QueryTask,
					esriQuery,
					graphicsUtils,
					Graphic,
					SimpleLineSymbol,
					SimpleFillSymbol,
					SimpleMarkerSymbol,
					Extent,
					Polygon,
					esriRequest,
					registry,
					Button,
					DropDownButton, 
					DropDownMenu, 
					MenuItem,
					ContentPane,
					TabContainer,
					HorizontalSlider,
					CheckBox,
					RadioButton,
					dom,
					domClass,
					domStyle,
					win,
					domConstruct,
					domAttr,
					domGeom,
					Dialog,
					Chart,
					Pie,
					Highlight, 
					MoveSlice, 
					Tooltip, 
					MiamiNice, 
					Legend,
					html,
					array,
					aspect,
					lang,
					dJson,
					on,
					parser,
					dojoquery,
					NodeListtraverse,
					localrequire,
					configData
					) {
					
			_config = dojo.eval("[" + configData + "]")[0];
			
			_infographic = _config.infoGraphic;
			console.log(_infographic);
			
			if (_infographic != undefined) {
			
				_infographic = localrequire.toUrl("./" + _infographic);
			
			}
			
			if (_config.ddText != undefined) {
			
				_ddText = _config.ddText;
			
			} else {
			
				_ddText = "Choose a Region";
			
			}
					
           return declare(PluginBase, {
		       toolbarName: _config.name,
               toolbarType: "sidebar",
               allowIdentifyWhenActive: false,
			   width: 420,
			   infoGraphic: _infographic, 
			   height: _config.pluginHeight,
			   rendered: false,
			   
               activate: function () { 
			   			   
					if (this.rendered == false) {
					
						this.rendered = true;
					
						this.render();
						
						//this.currentLayer.setVisibility(true);
					
					
					} else {
			  
						if (this.currentLayer != undefined)  {
						
						//	this.currentLayer.setVisibility(true);
						
						}
						

					} 
					
					//_eventHandles.click = dojo.connect(this.map, "onClick", function() {});
			  
			   },
			   
               deactivate: function () {

					if (this.mainLayer != undefined) {
				
						this.map.removeLayer(this.mainLayer);
					
					}				
			   
			   },
			   
               hibernate: function () { 
			   
					if (this.mainLayer != undefined)  {
					
						//this.mainLayer.setVisibility(false);
					
					}
					
					
					array.forEach(this.myLayers, lang.hitch(this,function(clayer, i){
						this.map.removeLayer(clayer);
					}));
					
					this.button.set("label",_ddText);
					
					domConstruct.empty(this.mainpane.domNode);
					
			   },
			   
			   
				initialize: function (frameworkParameters) {
				
					declare.safeMixin(this, frameworkParameters);
			
					domClass.add(this.container, "claro");
					
					this.configVizObject = dojo.eval("[" + configData + "]")[0].regions;
					
					console.log(this.configVizObject);
					
					menu = new DropDownMenu({ style: "display: none;"});
					
					domClass.add(menu.domNode, "claro");
					
					this.isClipped = false;
					
					array.forEach(this.configVizObject, lang.hitch(this,function(entry, i){
					
						console.log(entry);
						
						menuItem1 = new MenuItem({
							label: entry.name,
							//iconClass:"dijitEditorIcon dijitEditorIconSave",
							onClick: lang.hitch(this,function(e){this.changeGeography(entry)})
						});
						menu.addChild(menuItem1);
						
					}));
					

					this.button = new DropDownButton({
						label: _ddText,
						style: "margin-bottom:6px !important",
						dropDown: menu
					});
					
					dom.byId(this.container).appendChild(this.button.domNode);
					
					this.spinnerURL = localrequire.toUrl("./images/spinner.gif");
					
					this.refreshnode = domConstruct.create("span", {style: "display:none"}); //, innerHTML: "<img src=" + this.spinnerURL + ">" 
					spinnernode = domConstruct.create("span", {style: "background: url(" + this.spinnerURL + ") no-repeat center center; height: 32px; width: 32px; display: inline-block; position: absolute; left: 45%;" });
					//domClass.add(this.refreshnode, "plugin-report-spinner");
					this.refreshnode.appendChild(spinnernode);
					dom.byId(this.container).appendChild(this.refreshnode);
					
					this.messagenode = domConstruct.create("span", {style: "display:"});
					
					dom.byId(this.container).appendChild(this.messagenode);
					
				},
				
			     resize: function(w, h) {
				 
					cdg = domGeom.position(this.container);
					console.log(this.mainpane.domNode);
					
					this.sph = cdg.h-135;
					//alert(cdg.w);
					
					//this.tabpan.doLayout = false;
					
					domStyle.set(this.mainpane.domNode, "height", this.sph + "px");
					//domStyle.set(this.tabpan.domNode, "height", this.sph + "px");
					//domStyle.set(this.tabpan.domNode, "width", cdg.w + "px");
					//domStyle.set(this.mainpane.domNode, "width", cdg.w + "px");
					//domStyle.set(this.chartpane.domNode, "width", cdg.w + "px");
					
					this.tabpan.resize({"w" : cdg.w, "h" : this.sph})
				
					
					if (this.sph > 500) {
					
						ch = this.sph;
					
					} else {
					
						ch = 500;
					
					}
					
					if (this.chart != undefined) {
						this.chart.resize(cdg.w-50, ch - 80)
					}
					
					this.tabpan.layout();
					
					array.forEach(this.varsliders, lang.hitch(this,function(slider, i){
					
						domStyle.set(slider.domNode, "width", (cdg.w - 70) + "px");
					
					}));
					
				
				 },
				 
				 
			   changeGeography: function(geography, zoomto) {
			   
			  
					if (this.mainLayer != undefined) {
				
						this.map.removeLayer(this.mainLayer);
					
					}
			   
					this.currentgeography = geography;	
					
					ext = new Extent(this.currentgeography.extent);
					this.map.setExtent(ext);
					
			   
					if (geography.methods != undefined) {

						domStyle.set(this.methodsButton.domNode, "display", "");
					
					} else { 
					
						domStyle.set(this.methodsButton.domNode, "display", "none");
					
					}
					
					
					this.button.set("label",geography.name);
					
					domConstruct.empty(this.mainpane.domNode);
					
					this.varsliders = new Array();
					this.slidervalues = new Array();
					//loop here:
					
					cdg = domGeom.position(this.container);
					
					array.forEach(geography.variables, lang.hitch(this,function(svar, i){
					
						nslidernodetitle = domConstruct.create("div", {innerHTML: "<b>" + svar.name +"</b>", style: "padding-top:15px"});
						this.mainpane.domNode.appendChild(nslidernodetitle);
						
						cind = 0;
						outslid = ""
						array.forEach(svar.values, lang.hitch(this,function(slr, i){
						    if (slr.help != undefined) {
								outslid = outslid + "<li><a href='#' style='color:black' title='" + slr.help + "'>" + slr.name + "</a></li>"
							} else {
								outslid = outslid + "<li>" + slr.name + "</li>"
							}
							
							if (slr.default == true) {
							
								cind = i;
							
							} 
							
						}))
						
						nslidernode = domConstruct.create("div");
						this.mainpane.domNode.appendChild(nslidernode); 
						
						labelsnode = domConstruct.create("ol", {"data-dojo-type":"dijit/form/HorizontalRuleLabels", container:"bottomDecoration", style:"height:1.5em;font-size:75%;color:black;", innerHTML: outslid})
						nslidernode.appendChild(labelsnode);
				
				
						steps = svar.values.length;
						
						nowslider = new HorizontalSlider({
							name: svar.name,
							value: cind,
							minimum: 0,
							maximum: svar.values.length -1,
							showButtons:false,
							//intermediateChanges: true,
							discreteValues: steps,
							//index: entry.index,
							onChange: lang.hitch(this,this.changeScenario),
							style: "width:" + cdg.w - 100 + "px;margin-left:10px;margin-top:10px;margin-bottom:20px"
						}, nslidernode);
						
						this.varsliders[svar.index] = nowslider;
						this.slidervalues[svar.index] = svar.values;
						
						parser.parse();
						
						domStyle.set(nowslider.domNode, "width", (cdg.w - 70) + "px");
						
					}));
					
					//end loop here
					
					this.currentgeography.exclude = [];
					
					this.checkers = [];
					
					array.forEach(geography.habitats, lang.hitch(this,function(habitat, i){
					
						if (habitat.name != "exclude") {
							nslidernode = domConstruct.create("div");
							this.mainpane.domNode.appendChild(nslidernode); 
							
							   slider = new CheckBox({
								value: habitat.values,
								//index: entry.index,
								//minimum: entry.min,
								//maximum: entry.max,
								//checked: entry.default,
								onChange: lang.hitch(this,this.modifyFilterAttributes),
								}, nslidernode);
								
								this.checkers.push(slider);
								
								parser.parse()		
							
							nslidernodeheader = domConstruct.create("div", {style:"display:inline", innerHTML: " " + habitat.name + "<br>"});						
							this.mainpane.domNode.appendChild(nslidernodeheader);
						} else {
						
							this.currentgeography.exclude = habitat.values.sort();
						
						}
			
					}))
					
					parser.parse()
					
					/*
					var params = new ImageServiceParameters();
					params.noData = 0;
				
					this.mainLayer = new ArcGISImageServiceLayer(geography.url, {
					//  imageServiceParameters: params
					  //opacity: 0.75
					});
					
					this.map.addLayer(this.mainLayer);
					
					*/
					
					
					//this.clearFilters();
					this.changeScenario();
					
					//rasterFunction.functionName = "Colormap";
					//var arguments = {};
					//arguments.Colormap = [[0, 255, 2, 3],[2, 45, 52, 255],[3, 45, 255, 0]];
					//rasterFunction.arguments = arguments; 
					//rasterFunction.variableName = "Raster";
					
					
					
					//this.mainLayer.setRenderingRule(rasterFunction);
					
					
			   },
			   
			   drawPolygon: function() {
			   
					this.drawtoolbar.activate("polygon"); 
					
			   
			   },
			   
			   changeScenario: function() {
			   
					//slrval = this.currentgeography.slrs[this.SLRslider.value].value;
					//yearval = this.currentgeography.years[this.Yearslider.value].value;
					
					console.log(this.varsliders);
					
					outname = []
					
					icreached = false;
					disabledslids = new Array();
					
					title1 = new Array();
					
					array.forEach(this.varsliders, lang.hitch(this,function(slider, i){
					pushit = true;
					
					console.log(slider.value);
					
					 if (icreached == false) {
						outname.push(this.slidervalues[i][slider.value].value);
						
						title1.push(this.slidervalues[i][slider.value].name);
						
						if(this.slidervalues[i][slider.value].value == "initialCondition") {
							outname.push(this.currentgeography.initialCondition);
							icreached = true;
							pushit = false;
							title1 = [this.slidervalues[i][slider.value].name]
						}
					 }
					 
					 if (pushit == true) {
						disabledslids.push(slider);
					 }
					 
					
					}));
					
					
						array.forEach(disabledslids, lang.hitch(this,function(slider, i){
						
						 slider.setDisabled(false);
						
						 if (icreached == true) {
							 if (icreached == true) {
							   slider.setDisabled(true)
							 }
						 }
						
						}));
				
					
					ccombo = (outname.join("|"));
					
					console.log(ccombo)
					combolayers = (this.currentgeography.combos[ccombo]);
					
					if (combolayers == undefined) {
					
						html.set(this.messagenode, "No Data for Selection, Make Another");
					
					} else {
					
						html.set(this.messagenode, "");
					
					}
					
					
					console.log(combolayers);
			
					//if (this.myLayers.length != 0) {
					
					newarry = new Array();
					
					array.forEach(combolayers, lang.hitch(this,function(clayer, i){
					
						if (clayer.url == undefined) {
						
							clayer.url = this.currentgeography.mainURL
						
						}
						
						console.log(clayer.url);

						
						if (clayer.type == "dynamic") {
						
							Naddlayer = new ArcGISDynamicMapServiceLayer(
								clayer.url,{
								useMapImage: true
							}
							);
							
							Naddlayer.setVisibleLayers(clayer.show);
						
						}

						if (clayer.type == "tiled") {
						
							Naddlayer = new ArcGISTiledMapServiceLayer(
								clayer.url,{
								useMapImage: true
							}
							);
							
							//Naddlayer.setVisibleLayers(clayer.show);
						
						}
						
						newarry.push(Naddlayer);
						
						this.map.addLayer(Naddlayer);
					
					
					}));
					
					array.forEach(this.myLayers, lang.hitch(this,function(clayer, i){
						this.map.removeLayer(clayer);
					}));
					
					//}
					
					
					this.myLayers = new Array();
					
					array.forEach(newarry, lang.hitch(this,function(clayer, i){
						this.myLayers.push(clayer);
					}));					
					
					this.changeOpacity(this.translevel);
			   
			   },
			   
			   modifyFilterAttributes: function() {
			   
				cloneexclude = this.currentgeography.exclude.slice(0);
				cloneexclude.push.apply(cloneexclude, this.currentgeography.exclude);
				
				cloneexclude = (cloneexclude.sort());
				
				nochecks = true;
				
			    array.forEach(this.checkers, lang.hitch(this,function(habitat, i){
				
					if (habitat.checked == false) {
						cloneexclude.push.apply(cloneexclude, habitat.value);
						cloneexclude = (cloneexclude.sort());
						cloneexclude.push.apply(cloneexclude, habitat.value);
						cloneexclude = (cloneexclude.sort());
					} else {
					
						nochecks = false;
						
					}
				
				}));
			   
			    this.currentExclude = (cloneexclude.sort());
				
				if (nochecks == true) {
				  this.currentExclude = [];
				}
				
				this.applyFilter();
			   
			   },
			   
			   clearFilters: function() {
			   
			    ext = this.currentgeography.extent;
				polygonJson  = {"rings":[[[ext.xmin,ext.ymin],[ext.xmin,ext.ymax],[ext.xmax,ext.ymax],[ext.xmax,ext.ymin],[ext.xmin,ext.ymin]]],"spatialReference":this.currentgeography.extent.spatialReference};
				this.clippingGeometry = new Polygon(polygonJson);
				
				this.isClipped = false;

				

				cloneexclude = this.currentgeography.exclude.slice(0);
				cloneexclude.push.apply(cloneexclude, this.currentgeography.exclude);
				//this.currentExclude = (cloneexclude.sort());
				this.currentExclude = []
				
				this.applyFilter();
				
				ext = new Extent(this.currentgeography.extent);
				this.map.setExtent(ext);	
				
/*				
					var rasterFunction = new RasterFunction(
					
					{
						"rasterFunction": "Colormap",
						"rasterFunctionArguments": {
							"Colormap": this.currentgeography.colormap,
							"Raster": {
									
									"rasterFunction": "Remap",
									"rasterFunctionArguments": {
									"NoDataRanges": exclude,
									"variableName": "Raster"
										},
							"outputPixelType": "U8"
							} 
						},
						"outputPixelType": "U8"
					}	
					
					);
					
					
					this.mainLayer.setRenderingRule(rasterFunction);	

					ext = new Extent(this.currentgeography.extent);
					this.map.setExtent(ext);					
*/			   
			   
			   },
			   
			   
			   applyFilter: function() {
			  
				   
					//console.log(this.currentgeography.colormap);
					//console.log(this.currentExclude);
					//console.log(this.clippingGeometry.toJson());
				
					var rasterFunction = new RasterFunction(
					
					{
						"rasterFunction": "Colormap",
						"rasterFunctionArguments": {
							"Colormap": this.currentgeography.colormap,
							"Raster": {
									
									"rasterFunction": "Remap",
									"rasterFunctionArguments": {
									"NoDataRanges": this.currentExclude,
									"Raster": {
											"rasterFunction": "Clip",
											"rasterFunctionArguments": {
												"ClippingGeometry": this.clippingGeometry.toJson(),
												"ClippingType": 1
												},
											"outputPixelType": "U8",
											"variableName": "Raster"
											}
										},
							"outputPixelType": "U8"
							} 
						},
						"outputPixelType": "U8"
					}		
					
					);
					
					//alert(this.currentgeography.url + "/computeHistograms")

					ext = this.clippingGeometry.getExtent();

					if (ext.getHeight() > ext.getWidth()) {
						cv = ext.getHeight() / this.currentgeography.cellsize;
					} else {
						cv = ext.getWidth() / this.currentgeography.cellsize;
					}
					
					cvm = parseInt(cv / 2700) + 1;
					console.log(cvm);
				
					geo = dJson.toJson(this.clippingGeometry);
					mr = dJson.toJson(this.mainLayer.mosaicRule);
					rr = dJson.toJson(rasterFunction);
				
					computeHistograms = esriRequest({
					url: this.currentgeography.url + "/computeHistograms",
					  content: {
						geometry: geo,
						geometryType: "esriGeometryPolygon",
						f:  "json",
						mosaicRule: mr,
						pixelSize: '{"x": ' + cvm + ', "y": ' + cvm + '}',
						renderingRule: rr
					  },
					  callbackParamName: "callback",
					  handleAs: "json"
					});
					
					computeHistograms.then(lang.hitch(this, function(results) {

						//console.log(results.histograms);
						
						if (this.isClipped == false) {
						 clipmes = "Full Extent"
						} else {
						 clipmes = "User-defined Polygon Extent"
						};
						
						this.ctitle = this.currentgeography.name + " - " + clipmes + "<br>" + this.subTitle;
						
						
						this.currentData = []
						
						outable = "<tr style='background:" + "#fff" + "'><td style='width:21%'>" + "Code" + "</td><td style='width:60%'>" + "Name"  + "</td><td style='width:20%'>" + "Area (Acres)" + "</td></tr>"
						
						this.totalarea =  0;
						
						boxes = ""
						texts = ""
						count = 0
						
						array.forEach(results.histograms[0].counts, lang.hitch(this,function(histo, i){
						
							//alert(this.currentgeography.colormap[i])
							
							//for (var c=0; c<this.currentgeography.colormap; c++) {
						//	
						//		currentcolor = this.currentgeography.colormap[c];
						//		alert(currentcolor);
						//		if (currentcolor[0] == i) {
						//			alert(currentcolor);
						//		}
						//	}
							
							array.forEach(this.currentgeography.colormap, lang.hitch(this,function(ccolormap, c){
							
								if (ccolormap[0] == i) {
								
								//	alert(colormap)
									//console.log(ccolormap[0], i);
								
									outcolor = "rgb(" + ccolormap[1] + "," + ccolormap[2] + "," + ccolormap[3] + ")" 
									brightness = ((ccolormap[1] * 299) + (ccolormap[2] * 587) + (ccolormap[3] * 114)) / 1000;
									
									if (brightness > 150) {
										textColor = "#000";
									} else {
										textColor = "#fff";
									}
									
									
								
								}
									
							
							}));
							
							
							acers = parseInt(histo * (cvm * cvm) * 0.000247105)
							
							this.currentData.push({text: "", y: acers, tooltip: i + "", fill: outcolor, stroke: {color: "rgb(255,255,255)"}})
							
							this.totalarea = acers + this.totalarea
							
							if (histo != 0) {
								outable =  outable + "<tr style='background:" + outcolor + "'><td style='width:21%;color:" + textColor + "'>" + i + "</td><td style='width:60%;color:" + textColor + "'>" + this.currentgeography.labels[i + ""] + "</td><td style='width:20%;color:" + textColor + "'>" + acers.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "</td></tr>"
								
								boxes = boxes + '<rect x="0" y ="' + (count * 30) + '" width="30" height="20" style="fill:' + outcolor + ';stroke-width:1;stroke:' + outcolor + '" />'
								texts = texts + '<text x="35" y="' + (((count + 1) * 30) - 15) + '" fill="black">' + this.currentgeography.labels[i + ""] + '</text>'
								count = count + 1;
							}
							
						
						}));
						
						outable = "<center><table style='border:1px solid black'>" + outable + "</table></center>" 
						
						//this.legendContainer.innerHTML = this.toolbarName;
						
						domConstruct.empty(this.legendContainer);						
						
						this.legendContainer.innerHTML = '<div style="margin-bottom:7px">' + this.toolbarName + '</div><svg xmlns="http://www.w3.org/2000/svg" version="1.1">' + boxes + texts + '</svg>'
						
						/*
						pieChart = new Chart(this.chartareacontent);
						
						
						// Set the theme
						pieChart.setTheme(dojox.charting.themes.Claro);
				 
						// Add the only/default plot
						pieChart.addPlot("default", {
							type: "Pie",
							radius: 150,
							fontColor: "black",
							labelOffset: "-20"
						});
				 
						// Add the series of data
						pieChart.addSeries("Data",this.currentData);
				 
						// Render the chart!
						pieChart.render();
						
						*/
						domConstruct.empty(this.chartareacontent);
						domConstruct.empty(this.tableareacontent);
						//html.set(this.tableareacontent, "I was set!");
						
						
						newnode = domConstruct.create("span", {innerHTML: outable});
						this.tableareacontent.appendChild(newnode);
						
						
						this.chart = new Chart(this.chartareacontent);
						this.chart.addPlot("default", {
							type: Pie,
							font: "normal normal 11pt Tahoma",
							fontColor: "black",
							labelOffset: -30,
							radius: 70
						}).addSeries("Series A", this.currentData);
						//var anim_a = new MoveSlice(this.chart, "default");
						//var anim_b = new Highlight(this.chart, "default");
						//var anim_c = new Tooltip(this.chart, "default");
						
						this.chart.connectToPlot("default",lang.hitch(this,function(evt) {
							
							type = evt.type; shape = evt.shape;
							
							if(type == "onmouseover") {
							
							// Store the original color
							if(!shape.originalFill) {
								shape.originalFill = shape.fillStyle;
								
								shadeRGBColor = function(color, percent) {
									color = "rgb(" + color.r + "," + color.g + "," + color.b + ")";
									f=(color + "").split(","),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=parseInt(f[0].slice(4)),G=parseInt(f[1]),B=parseInt(f[2]);
									return "rgb("+(Math.round((t-R)*p)+R)+","+(Math.round((t-G)*p)+G)+","+(Math.round((t-B)*p)+B)+")";
								}
								
								shape.altFill = shadeRGBColor(shape.originalFill,0.30)
							}
						
								shape.setFill(shape.altFill);
								
								domConstruct.empty(this.chartinfo);
								
								newnode = domConstruct.create("span", {innerHTML: this.currentgeography.labels[evt.x + ""] + ": " + evt.y.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " acres (" + (parseInt((evt.y / this.totalarea) * 100)) +" %)"});
								this.chartinfo.appendChild(newnode);
								
								
								
							}
				
					
							if(type == "onmouseout") {
								// Set the fill the original fill
								shape.setFill(shape.originalFill);
								
								domConstruct.empty(this.chartinfo);
								newnode = domConstruct.create("span", {innerHTML: this.ctitle + "<br>Mouse Over Chart for Information -- Scroll Down to see Table"});
								this.chartinfo.appendChild(newnode);
								
							}
						
		
						}));
						
						
						this.chart.render();
						//var legendTwo = new Legend({chart: chartTwo}, "legendTwo");
						

						domConstruct.empty(this.chartinfo);
						newnode = domConstruct.create("span", {innerHTML: this.ctitle + "<br>Mouse Over Chart for Information -- Scroll Down to see Table"});
						this.chartinfo.appendChild(newnode);
						
						
					})
					, function(b) { console.log('ERROR'); console.log(b)});
					
					
					
					
					//parser.parse();
					
					
					this.mainLayer.setRenderingRule(rasterFunction);	
					//console.log(this.currentData);
			   
			   },
			   
			   
			   modifyFilter: function(geometry) {
			
	/*		   if (typeof geometry == 'boolean') {
					//alert('hi');
					
					//ext = new Extent(this.currentgeography.extent)
					//geometry = ext.toPolygon();
					ext = this.currentgeography.extent
					
					polygonJson  = {"rings":[[[ext.xmin,ext.ymin],[ext.xmin,ext.ymax],[ext.xmax,ext.ymax],[ext.xmax,ext.ymin],[ext.xmin,ext.ymin]]],"spatialReference":this.currentgeography.extent.spatialReference};
					geometry = new Polygon(polygonJson);
					
		//			alert('');
			   };
			   
			 */
			   
			   this.drawtoolbar.deactivate();
			   
			   
			   this.clippingGeometry = geometry;
			   
			   this.isClipped = true;
			   
			   var simpleJson = {
					  "type": "esriSFS",
					  "style": "esriSFSSolid",
					  "color": [115,76,0,255],
						"outline": {
						 "type": "esriSLS",
						 "style": "esriSLSSolid",
						 "color": [110,110,110,255],
						 "width": 1
						 }
					}
				
				symbol = new SimpleFillSymbol(simpleJson);
			   
				this.applyFilter();
				
				
				ext = geometry.getExtent();
				this.map.setExtent(ext);	
			   
			   },

			   setup : function(response) {
					
					console.log("Success: ", response);

					this.layerlist = {};
					
					array.forEach(response.layers, lang.hitch(this,function(layer, i){
					
						layerSplit = layer.name.split("__")
						//console.log(layerSplit)
						//console.log(layerSplit.length);
						
						this.layerlist[layer.name] = layer.id;
						
						array.forEach(layerSplit, lang.hitch(this,function(cat, i){
						
							cgi = this.groupindex[i]
							
							
							if (this.controls[cgi].options == undefined) {
							
								this.controls[cgi].options = [];
								makedefault = true;
							
							} else {
							
								makedefault = false;
							
							}
							
							withingroup = false;
							
						    array.forEach(this.controls[cgi].options, lang.hitch(this,function(opts, i){
								
								if (opts.value == cat) {
								
									withingroup = true;
								
								}
							
							}));
							
							if (withingroup == false) {
							
								newoption = {};
								newoption.text = cat;
								newoption.selected = makedefault;
								newoption.value = cat;
							
								this.controls[cgi].options.push(newoption)
							
							}
							
						
						}));
						
					}));
					
							
				},
			
			   updateMap: function() {
			   					
					outvalues = [];
					
					array.forEach(this.controls, lang.hitch(this,function(entry, orderid){
					
						if (entry.type == "group") {
					
						array.forEach(entry.options, lang.hitch(this,function(option, i){
			   
							if (option.selected == true) {
							
								//need to put code to build here
								
								if (option.enabled) {outvalues.push(option.value)};
							
							}
			   
						}));
						
						}
						
					}));
				
					
					
					layertoAdd = this.layerlist[outvalues.join("__")];
					
					x = 0;
					while  (layertoAdd == undefined) {
					
						outvalues = outvalues.slice(0,outvalues.length -1)
						layertoAdd = this.layerlist[outvalues.join("__")];
						
						x = x + 1
						if (x > 9999) {
							layertoAdd = "None"
						}

					
					}

					console.log(layertoAdd);
					
					slayers = [];
					slayers.push(layertoAdd);
					
					//this.currentLayer.setVisibility(true);
					this.currentLayer.setVisibleLayers(slayers)
					
				},
				

				
				updateUnique: function(val,group) {
				
				console.log(val);
			   
					array.forEach(this.controls[group].options, lang.hitch(this,function(option, i){
			   
						option.selected = false;
			   
					}));
					
					
					this.controls[group].options[val].selected = true;
					//console.log(this.controls);
					
					this.findInvalids();
					
					this.updateMap();
					
					
				},
				
				
				findInvalids: function() {
				
				
					clist = [];
				
					array.forEach(this.groupindex, lang.hitch(this,function(cat, cgi){
					
						ccontrol = this.controls[cat]
						
						okvals = [];
						
						needtoChange = false;
						
						array.forEach(ccontrol.options, lang.hitch(this,function(option, i){
			   
							if (option.selected == true) {
							
								clist.push(option.value)
							
							}
							

							tlist = clist.slice(0,cgi);
							tlist.push(option.value);
							
							checker = tlist.join("__");
							
							enabled = false
							
							for (key in this.layerlist) {
							
								n = key.indexOf(checker);
							
								if (n==0) {
								
									enabled = true;
								
								}
							
							}
							
							option.enabled = enabled;
							
							cdom = dom.byId(this.sliderpane.id + "_lvoption_" + cat + "_" + i)
							
							if (enabled) {
								domStyle.set(cdom,"color","#000")
								okvals.push(i);
							} else {
								domStyle.set(cdom,"color","#bbb")
							}
			   
							if ((enabled == false) && (option.selected == true)) {
							
								needtoChange = true;
							
							} 
			   
						}));						
						
						if ((needtoChange == true) && (okvals.length > 0)) {
						
							if (ccontrol.control == "slider") {
							
								cwidget = registry.byId(this.sliderpane.id + "_slider_" + cat)
								cwidget.set('value',okvals[0]);
							
							} else {
							
								//cwidgets = registry.findWidgets(ccontrol.node)
							
								cwidget = registry.byId(this.sliderpane.id + "_radio_" + cat + "_" + okvals[0])
							
								cwidget.set('value',true);
							
							}
						
						//alert('changeit');
						
						}
					
						
							
					}));
				
					
				
				},
				
				zoomToActive: function() {
				
					ext = new Extent(this.currentgeography.extent);
					this.map.setExtent(ext, true);				
				
				},
				
				changeOpacity: function(e) {
					
					this.translevel = e;
					
					array.forEach(this.myLayers, lang.hitch(this,function(clayer, i){						
						clayer.setOpacity(1 - this.translevel);
					}));
				
					
				
				},
				
				viewChart: function() {
				
					console.log(this.currentData);
					domStyle.set(this.chartArea.domNode, 'display', '');
				
				},
				
				render: function() {
				
					this.myLayers = new Array();
						
					a = dojoquery(this.container).parent();
					
					domStyle.set(this.container, 'overflow', 'hidden');
					
					this.infoarea = new ContentPane({
					  style:"z-index:10000; !important;position:absolute !important;left:310px !important;top:0px !important;width:350px !important;background-color:#FFF !important;padding:10px !important;border-style:solid;border-width:4px;border-color:#444;border-radius:5px;display: none",
					  innerHTML: "<div class='infoareacloser' style='float:right !important'><a href='#'>✖</a></div><div class='infoareacontent' style='padding-top:15px'>no content yet</div>"
					});
					
					dom.byId(a[0]).appendChild(this.infoarea.domNode)
					
					ina = dojoquery(this.infoarea.domNode).children(".infoareacloser");
					this.infoAreaCloser = ina[0];

					inac = dojoquery(this.infoarea.domNode).children(".infoareacontent");
					this.infoareacontent = inac[0];

					
					on(this.infoAreaCloser, "click", lang.hitch(this,function(e){
						domStyle.set(this.infoarea.domNode, 'display', 'none');
					}));
					
					
					this.chartArea = new ContentPane({
					  style:"overflow:hidden;z-index:10000; !important;position:absolute !important;left:310px !important;top:20px !important;width:430px !important;background-color:#FFF !important;padding:10px !important;border-style:solid;border-width:4px;border-color:#444;border-radius:5px;display: none",
					  innerHTML: "<div class='chartareacloser' style='float:right !important'><a href='#'>✖</a></div><div class='chartareacontent' style='width:330px;height:350px;padding-top:15px'>no content yet</div>"
					});
					
					dom.byId(a[0]).appendChild(this.chartArea.domNode)
					
					ina = dojoquery(this.chartArea.domNode).children(".chartareacloser");
					this.ChartAreaCloser = ina[0];

					inac = dojoquery(this.chartArea.domNode).children(".chartareacontent");
					this.chartareacontent = inac[0];

					
					on(this.ChartAreaCloser, "click", lang.hitch(this,function(e){
						domStyle.set(this.chartArea.domNode, 'display', 'none');
					}));
					
					this.tabpan = new TabContainer({
						//style: "height: 100%; width: 100%;"
					});
					
					this.mainpane = new ContentPane({
					 // style:"height:" + this.sph + "px !important",
					 //style: "height: 100%; width: 100%;",
					  title: "Choose Parameters"
					});
					
					parser.parse();
					
					//dom.byId(this.container).appendChild(this.tabpan.domNode);
					
					dom.byId(this.container).appendChild(this.mainpane.domNode);
					
					//this.tabpan.addChild(this.mainpane);
					//this.tabpan.addChild(this.chartpane);
					
					//aspect.after(this.tabpan, "selectChild", lang.hitch(this,function (event) {
					//	this.resize();
					//}));
					
					//this.tabpan.startup();
					
					//dom.byId(this.container).appendChild(this.mainpane.domNode);
					parser.parse();
					

					
		
					
					this.buttonpane = new ContentPane({
					  style:"border-top-style:groove !important; height:100px;overflow: hidden !important;background-color:#F3F3F3 !important;padding:10px !important;"
					});
					
					
					dom.byId(this.container).appendChild(this.buttonpane.domNode);	
		
					
							nslidernodetitle = domConstruct.create("span", {innerHTML: " Layer Properties: "});
							this.buttonpane.domNode.appendChild(nslidernodetitle);
								
							zoombutton = domConstruct.create("a", {class: "pluginLayer-extent-zoom", href: "#", title: "Zoom to Extent"});
							this.buttonpane.domNode.appendChild(zoombutton);
							on(zoombutton, "click", lang.hitch(this, this.zoomToActive));
							
							nslidernode = domConstruct.create("span", {style: "margin-left:10px !important"});
							this.buttonpane.domNode.appendChild(nslidernode); 			
				
							//myButton = new Button({
							//	label: "Chart",
							//	onClick: lang.hitch(this,this.viewChart)
							//}, nslidernode);
						
							nslidernode = domConstruct.create("div");
							this.buttonpane.domNode.appendChild(nslidernode); 
							
							labelsnode = domConstruct.create("ol", {"data-dojo-type":"dijit/form/HorizontalRuleLabels", container:"bottomDecoration", style:"height:0.25em;padding-top: 10px !important;color:black !important", innerHTML: "<li>Opaque</li><li>Transparent</li>"})
							nslidernode.appendChild(labelsnode);
							
							slider = new HorizontalSlider({
								value: 0,
								minimum: 0,
								maximum: 1,
								showButtons:false,
								title: "Change the layer transparency",
								intermediateChanges: true,
								//discreteValues: entry.options.length,
								onChange: lang.hitch(this,this.changeOpacity),
								style: "width:210px;margin-top:10px;margin-bottom:20px;margin-left:20px; background-color:#F3F3F3 !important"
							}, nslidernode);
							
							parser.parse()	

						this.methodsButton = new Button({
							label: "View Full Report",
							style:  "position: absolute; right:5px; bottom:5px !important;",
							onClick: lang.hitch(this,function(){window.open(this.currentgeography.methods)})  //function(){window.open(this.configVizObject.methods)}
							});	
						this.buttonpane.domNode.appendChild(this.methodsButton.domNode);

					domStyle.set(this.methodsButton.domNode, "display", "none");
					
					this.resize();
						

				},
					
				oldrender: function() {
					
					
					array.forEach(this.controls, lang.hitch(this,function(entry, groupid){
						
						if (entry.type == "header") {

							nslidernodeheader = domConstruct.create("div", {style:"margin-top:0px;margin-bottom:10px", innerHTML: "<b>" + entry.text + ":</b>"});
							this.sliderpane.domNode.appendChild(nslidernodeheader);	
							
						} 
						
						if (entry.type == "text") {

							nslidernodeheader = domConstruct.create("div", {style:"margin-top:10px;margin-bottom:10px", innerHTML: entry.text});
							this.sliderpane.domNode.appendChild(nslidernodeheader);	
							
						} 
						
						
						if (entry.type == "group") {		
						
							if (entry.control == "slider") {
							
							  outslid = "";
								
							  array.forEach(entry.options, lang.hitch(this,function(option, i){
								
								if (option.help != undefined) {
									outslid = outslid + "<li><span id='" + this.sliderpane.id + "_lvoption_" + groupid + "_" + i + "'> <a style='color:black' href='#' title='" + option.help + "'>" + option.text.replace(" ","<br>").replace(" ","<br>").replace(" ","<br>").replace(" ","<br>").replace(" ","<br>").replace(" ","<br>").replace(" ","<br>") + "</a></span></li>";
								} else {
									outslid = outslid + "<li><span id='" + this.sliderpane.id + "_lvoption_" + groupid + "_" + i + "'> " + option.text.replace(" ","<br>").replace(" ","<br>").replace(" ","<br>").replace(" ","<br>").replace(" ","<br>").replace(" ","<br>").replace(" ","<br>") + "</span></li>";
								
								}
								if (option.selected == true) {
									defaultvalue = i;	
								}
								
								// id='" + this.toolbarName + "_" + groupid + "_" + i + "'
								
							  })); 
	
							nslidernodetitle = domConstruct.create("div", {innerHTML: entry.title});
							this.sliderpane.domNode.appendChild(nslidernodetitle);
							
							nslidernode = domConstruct.create("div");
							this.sliderpane.domNode.appendChild(nslidernode); 
							
							labelsnode = domConstruct.create("ol", {"data-dojo-type":"dijit/form/HorizontalRuleLabels", container:"bottomDecoration", style:"height:0.25em;padding-top: 10px !important;color:black !important", innerHTML: outslid})
							nslidernode.appendChild(labelsnode);
							
							slider = new HorizontalSlider({
								name: "group_" + groupid,
								id: this.sliderpane.id + "_slider_" + groupid,
								value: defaultvalue,
								minimum: 0,
								maximum: (entry.options.length -1),
								showButtons:false,
								title: entry.title,
								intermediateChanges: true,
								discreteValues: entry.options.length,
								index: groupid,
								onChange: lang.hitch(this,function(e) {this.updateUnique(e, groupid)}),
								style: "width:210px;margin-top:10px;margin-bottom:20px"
							}, nslidernode);
							
							parser.parse()
							
							//entry.node = slider.domNode;

	
							} else {
						
							
							   ncontrolsnode = domConstruct.create("div");
							   this.sliderpane.domNode.appendChild(ncontrolsnode);
							   
							   if (entry.title != undefined) {
									
									ncontrolsnodetitle = domConstruct.create("div", {innerHTML: entry.title});
									ncontrolsnode.appendChild(ncontrolsnodetitle);
								
							   }
								
							   array.forEach(entry.options, lang.hitch(this,function(option, i){
							   
							//	if (entry.control == "radio") {
									rorc = RadioButton;
							//	} else {
							//		rorc = CheckBox;
							//	}
							
								//alert(option.help)
								

								ncontrolnode = domConstruct.create("div");
								ncontrolsnode.appendChild(ncontrolnode); 
								parser.parse();
								
								   ncontrol = new rorc({
									name: "group_" + groupid,
									id: this.sliderpane.id + "_radio_" + groupid + "_" + i,
									value: option.value,
									index: groupid,
									title: option.text,
									checked: option.selected,
									onChange: lang.hitch(this,function(e) { if(e) {this.updateUnique(i, groupid)}})
									}, ncontrolnode);
									
									if (option.help != undefined) {
										nslidernodeheader = domConstruct.create("div", {style:"display:inline", innerHTML: "<span style='color:#000' id='" + this.sliderpane.id + "_lvoption_" + groupid + "_" + i + "'><a style='color:black' href='#' title='" + 'Click for more information.' + "'><img src='data:image/png;base64,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'></a> " + option.text + "</span><br>"});
									} else {
										nslidernodeheader = domConstruct.create("div", {style:"display:inline", innerHTML: "<span style='color:#000' id='" + this.sliderpane.id + "_lvoption_" + groupid + "_" + i + "'> " + option.text + "</span><br>"});									
									}
									
									on(nslidernodeheader, "click", lang.hitch(this,function(e){
										domStyle.set(this.infoarea.domNode, 'display', '');
										this.infoareacontent.innerHTML = option.help;
									}));
									
									ncontrolsnode.appendChild(nslidernodeheader);

								
									parser.parse()	
							  
							  })); 
							  
							  //entry.node = ncontrolsnode;
							  
							}
						
							
							nslidernodeheader = domConstruct.create("br");
							this.sliderpane.domNode.appendChild(nslidernodeheader);	

						
						}						
						
					
					}));
					
					this.currentLayer = new ArcGISDynamicMapServiceLayer(this.configVizObject.url);
					
					
					
					this.map.addLayer(this.currentLayer);
					
					
					dojo.connect(this.currentLayer, "onLoad", lang.hitch(this,function(e){
					
											this.findInvalids();
					
											this.updateMap();
											
											//alert(this.currentLayer.name)
											
											}));
										
				
				},

			   
			//identify: function(mapPoint, clickPoint, processResults) {
                //var text = "You clicked on latitude " + mapPoint.getLatitude() + " longitude " + mapPoint.getLongitude(),
                //    identifyWidth = 300;
                //processResults(text, identifyWidth);
            //},
				
			   showHelp: function () {
			   
									helpDialog = new Dialog({
									
										title: "My Dialog",
										content: "Test content.",
										style: "width: 300px"
									
									});	

									helpDialog.show();
									
			   },
				
               getState: function () { 
			   
				console.log(this.controls);
			   
				state = this.controls;
			   
				return state;
	
			   
				},
				
				
               setState: function (state) { 
				
				this.controls = state;
				
				this.render();
				
				
				},
           });
       });

