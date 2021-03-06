<?php include './media/php/OAuthLogin.php' ?>


<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Brain Circuits Diagram</title>

    <!--Stylesheets-->
    <link rel="stylesheet" href="media/lib/bootstrap/css/bootstrap.min.css" />
    <link rel="stylesheet" href="media/lib/chosen/chosen.css" />
    <link rel="stylesheet" href="media/css/style-ui.css" type="text/css" charset="utf-8">
    <link rel="stylesheet" href="media/css/style-canvas.css" type="text/css" charset="utf-8">
    <link rel="stylesheet" href="media/css/colors.css" type="text/css" charset="utf-8">
    <link rel="stylesheet" href="media/lib/jquery-ui/css/redmond/jquery-ui.css" />

    <!-- HTML5 shim, IE6-8 support of HTML5 elements -->
    <!--[if lt IE 9]>
    <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->
  </head>
  <body>
    <div id="test">
    </div>
    <div id="user">
        <!--a href="signin.html" target="_blank">Sign In</a-->

        <span>&nbsp &nbsp &nbsp</span>
        <a href="http://hivizexplorer.com/lazarus/" target="_blank">Message Board</a>
    </div>
    <!--UTIL TAB RIGHT-->
    <div id="util">
      <ul class="nav nav-tabs">
        <li class="active"><a href="#legend" data-toggle="tab">Legend</a></li>
        <li><a href="#options" data-toggle="tab">Options</a></li>
        <li><a href="#search" data-toggle="tab">Search</a></li>

        <li><a href="#info" data-toggle="tab">Info</a></li>
      </ul>
      <div id="util-content" class="tab-content">

        <!--INFO-->
        <div id="info" class="tab-pane fade in active">
            <div id="conn-info" class="accordion">
                <h4>Connection information</h4>
                <div id="self" class="accordion-group">
                    <div class="accordion-heading">
                        <a class="accordion-toggle" data-toggle="collapse" data-parent="#conn-info" href="#self-content">
                            Exact Match
                        </a>
                    </div>
                    <div id="self-content" class="accordion-body collapse in">
                        <div class="accordion-inner accordion-content">
                            <p id="src-name">&nbsp &nbsp &nbsp</p>
                            <p id="tgt-name">&nbsp &nbsp &nbsp</p>
                            <div id="record" class="tabbable tabs-below">
                                <div id="record-content" class="tab-content">
                                    <div id="self-record-paper" class="tab-pane fade in active">
                                    </div>
                                    <div id="self-record-bams" class="tab-pane fade in">
                                    </div>
                                </div>
                                <ul class="nav nav-tabs">
                                    <li class="active"><a href="#self-record-paper" data-toggle="tab">Paper</a></li>
                                    <li ><a href="#self-record-bams" data-toggle="tab">BAMS Record</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="children" class="accordion-group">
                    <div class="accordion-heading">
                        <a class="accordion-toggle" data-toggle="collapse" data-parent="#conn-info" href="#children-content">
                            Derived connections
                        </a>
                    </div>
                    <div id="children-content" class="accordion-body collapse">
                        <div class="accordion-inner accordion-content">
                            <div id="children-list">
                            </div>
                            <div id="paper-list">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="region-info">
                <h4>Brain Region information</h4>
                <div id="source-region-info" class="accordion-group">
                    <div class="accordion-heading">
                        <a class="accordion-toggle" data-toggle="collapse" data-parent="#region-info" href="#source-info-content">
                            Source region
                        </a>
                    </div>
                    <div id="source-info-content" class="accordion-body collapse in">
                        <div class="accordion-inner accordion-content">
                            <div class="tab-content">
                                <ul class="nav nav-tabs">
                                    <li class="active"><a href="#source-slice" data-toggle="tab">Anatomical image</a></li>
                                    <li><a href="#source-wiki" data-toggle="tab">Other resources</a></li>
                                </ul>
                                <div id="source-slice" class="slice tap-pane fade in active">
                                </div>
                                <div id="source-wiki" class="wiki tap-pane fade in">
                                    <!--<iframe src="http://en.wikipedia.org/wiki/Cerebrum"></iframe>-->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="target-region-info" class="accordion-group">
                    <div class="accordion-heading">
                        <a class="accordion-toggle" data-toggle="collapse" data-parent="#region-info" href="#target-info-content">
                            Target region
                        </a>
                    </div>
                    <div id="target-info-content" class="accordion-body collapse">
                        <div class="accordion-inner accordion-content">
                            <div class="tab-content">
                                <ul class="nav nav-tabs">
                                    <li class="active"><a href="#target-slice" data-toggle="tab">Anatomical image</a></li>
                                    <li><a href="#target-wiki" data-toggle="tab">Other resources</a></li>
                                </ul>
                                <div id="target-slice" class="slice tap-pane fade in active">
                                </div>
                                <div id="target-wiki" class="wiki tap-pane fade in">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div><!--END INFO-->

        <!--LEGEND-->
        <div id="legend" class="tab-pane fade in active">
          <div id="legend-primary" style="position:relative; height:150px;">
            <h4>Primary</h4></br>
            <div style="background-color:#2ca02c; height:20px; width:20px; position:absolute; top:35px;"></div>
            <p style="position:absolute; left:25px; top:35px;">Source region / Outgoing connecion</p>
            <div style="background-color:#d62728; height:20px; width:20px; position:absolute; top:70px;"></div>
            <p style="position:absolute; left:25px; top:70px;">Target region / Incoming connecion</p>
            <div style="background-color:#062db8; height:20px; width:20px; position:absolute; top:105px;"></div>
            <p style="position:absolute; left:25px; top:105px;">Bidirectional connection</p>
          </div>
          <div id="legend-feature" style="position:relative">
            <h4>Feature Color</h4></br>
          </div>
        </div><!--END LEGEND-->

        <!--OPTIONS-->
        <div id="options" class="tab-pane fade in">
          <table>
            <tr><td class="tab-column-1"><h4>Edge color</h4></td></tr>
            <tr>
              <td class="tab-column-1">Feature</td>
              <td class="tab-column-2">
                <select data-placeholder="Choose an attribute" class="chzn-select" style="width:250px;" id="attrSelect">
                  <option></option>
                </select>
              </td>
            </tr>
            <tr>
              <td class="tab-column-1">Scale</td>
              <td class="tab-column-2">
                <select data-placeholder="Choose a scale" class="chzn-select" style="width:250px;" id="scaleSelect">
                  <option></option>
                </select>
              </td>
            </tr>
          </table>
          <br/>
          <table>
            <tr><td class="tab-column-1"><h4>General</h4></td></tr>
            <tr>
              <td class="tab-column-1">Level of detail</td>
              <td class="tab-column-2"><select data-placeholder="Choose a level" class="chzn-select" style="width:250px;" id="lodSelect">
                  <option></option>
                  <option>Region</option>
                  <option>Cell</option>
              </select></td>
            </tr>
            <tr>
              <td class="tab-column-1">Tension</td>
              <td class="tab-column-2"><input id="tension" type="range" min=0 max=100 value=85 step=1>
                <span id="tensionValue">0.85</span>
              </td>
            </tr>
          </table>
        </div><!--END OPTIONS-->

        <!--SEARCH-->
        <div id="search" class="tab-pane fade in">
          <div id="search-settings">
          <table>
            <tr>
              <td class="tab-column-1">Source</td>
              <td class="tab-column-2">
                <select data-placeholder="Choose a brain area" class="chzn-select" style="width:250px;" id="sourceSelect">
                  <option></option>
                </select>
              </td>
            </tr>
            <tr>
              <td class="tab-column-1">Target</td>
              <td class="tab-column-2">
                <select data-placeholder="Choose a brain area" class="chzn-select" style="width:250px;" id="targetSelect">
                  <option></option>
                </select>
              </td>
            </tr>
            <tr>
              <td class="tab-column-1">Number of intermediate connections</td>
              <td class="tab-column-2">
                <input id="maxHop" type="range" min=1 max=5 value=1 step=1>
                <span id="maxHopValue">1</span>
              </td>
            </tr>
          </table>
          </br>
          <table>
            <tr>
              <td style="width:350px"><button id="bt-search" class="btn">Show connectivity for selected regions</button></td>
              <td style="width:50px;"><button id="bt-clear" class="btn btn-warning">Clear</button></td>
            </tr>
          </table>
          </div>
          <!--Search Results-->
          <!--
          <div id="localCon" class="localCon">
            <h4>Search Results</h4>
          </div>
          -->
          <!---List Link Connections (Search Results)-->
          <div id="search-results" class="tab-content">
            <ul class="nav nav-tabs">
              <li class="active"><a href="#paper-list" data-toggle="tab">Show literature list</a></li>
              <li><a href="#sub-con-list" data-toggle="tab">Show sub-connection list</a></li>
            </ul>
            <div id="paper-list" class="tab-pane fade in active search-results-contents">
              <p class="search-results-exp explanation"><i>Search for the connections between two brain regions and the relevant literature will be displayed here.</i></p>
            </div>
            <div id="sub-con-list" class="tab-pane fade in search-results-contents">
              <p class="search-results-exp explanation"><i>Search for the connections between two brain regions and the underlying sub-connections will be displayed here.</i></p>
            </div>
          </div>

        </div><!--END SEARCH-->

        <!--HELP-->
<!--        <div id="help" class="tab-pane fade in">
          <p>
            <a href="http://www.youtube.com/watch?v=PyPHzxaCEfU&feature=youtu.be">Demo video</a>
            Tips: <br/>
            1. To locate a brain region: type in its name in the "Search for a region"
            text box and it will be highlighted in the visualization <br/><br/>
            2. To search for connections between two regions: left click to set a region
            to be the source and shift + left click to set a region to be the target;
            then set the level for indirect connections using the "Max hop" slider.
            Click search to highlight the connections between the selected regions,
            or click clear to clear the highlighted connections <br/><br/>
            3. To adjust the level of details: use the "Max depth" slider
          </p>
        </div>--><!--END HELP-->

      </div><!--END UTIL CONTENT-->
    <!--References and Link Details-->
<!--    <div id="detail" class="tabbable tabs-left detail-panel">
      <h4>Connection Details</h4>
      <span id="ref-src">Source: no selection </span><br/>
      <span id="ref-tgt">Target: no selection </span><br/>
      <ul id="detail-tab" class="nav nav-tabs nav-tabs-add">
      </ul>
      <div id="detail-content-pane" class="tab-content">
      </div>
    </div> -->
    </div><!--END UTIL RIGHT-->

    <!--
    <div id="legend" class="legend">
      <h3>Legend</h3>
    </div>
    -->

    <div id="canvas">
      <div id="canvas-body"">
      <ul class="nav nav-tabs">
        <li class="active"><a href="#canvas-circular" data-toggle="tab">Circular view</a></li>
        <li><a href="#canvas-force" data-toggle="tab">Force-directed view</a></li>
      </ul>
      <div id="canvas-content" class="tab-content">
        <div id="canvas-circular" class="tab-pane fade in active">
        </div>
        <div id="canvas-force" class="tab-pane fade in">
        </div>
      </div>
      </div>
    </div>



    <!-- MODAL WINDOW - User Study
    <div class="modal hide fade" id="messageBox" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true" style="width:600px;">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
        <h3 id="myModalLabel">New Incoming Message</h3>
      </div>
      <div class="modal-body">
        <p id="message"></p>
        <textarea rows="6" class="input-xxlarge"></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>
        <button class="btn btn-primary">Send</button>
      </div>
    </div>
    <a href="#messageBox" role="button" class="btn" data-toggle="modal" style="position:absolute; bottom:200px; left:100px;">Launch demo modal</a>
    -->

    <!--JAVASCRIPT-->

    <!--LIBRARIES-->
    <script type="text/javascript" src="media/lib/jquery-1.7.2.min.js"></script>
    <script type="text/javascript" src="media/lib/bootstrap/js/bootstrap.min.js"></script>
    <script type="text/javascript" src="media/lib/d3.v2.js"></script>
    <script type="text/javascript" src="media/lib/chosen/chosen.jquery.js"></script>
    <script type="text/javascript" src="media/lib/jquery-ui/js/jquery-ui.js"></script>

    <!--TODO: brainmap and script should be compressed as one file-->
    <script type="text/javascript" src="media/js/brainCircuits.js"></script>
    <script type="text/javascript" src="media/js/brainMap.js"></script>

    <!-- Piwik --> 
    <script type="text/javascript">
    var pkBaseURL = (("https:" == document.location.protocol) ? "https://hivizexplorer.com/piwik/" : "http://hivizexplorer.com/piwik/");
    document.write(unescape("%3Cscript src='" + pkBaseURL + "piwik.js' type='text/javascript'%3E%3C/script%3E"));
    </script><script type="text/javascript">
    try {
        var piwikTracker = Piwik.getTracker(pkBaseURL + "piwik.php", 3);
        piwikTracker.trackPageView();
        piwikTracker.enableLinkTracking();
    } catch( err ) {}
    </script><noscript><p><img src="http://hivizexplorer.com/piwik/piwik.php?idsite=3" style="border:0" alt="" /></p></noscript>
    <!-- End Piwik Tracking Code -->
</body>
</html>
