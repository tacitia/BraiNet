<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Brain Circuits Diagram</title>

    <!--Stylesheets-->
    <link rel="stylesheet" href="../lib/bootstrap/css/bootstrap.min.css" />
    <link rel="stylesheet" href="../lib/chosen/chosen.css" />
    <link rel="stylesheet" href="../css/style-ui.css" type="text/css" charset="utf-8">
    <link rel="stylesheet" href="../css/colors.css" type="text/css" charset="utf-8">
    <link rel="stylesheet" href="../lib/jquery-ui/css/redmond/jquery-ui.css" />

    <!-- HTML5 shim, IE6-8 support of HTML5 elements -->
    <!--[if lt IE 9]>
    <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->
  </head>
  <body>
      <div style="width:800px;margin-left:auto;margin-right:auto">
      <?php
        echo '<span>Dataset name: </span><span id="datasetName">' . $_GET["datasetName"] . '</span><br>';
        echo '<span id="datasetID" style="display:none">' . $_GET["datasetID"] . '</span>'
      ?>
      </div>
      <div id="nodesDisplay" class="datasetDisplay">
        <table id="nodesTable" class="table table-bordered table-striped table-condensed">
          <tr class="tableTitle"><td>Node name</td><td>Depth</td><td>Parent name</td></tr>
        </table>
      </div>
      <div id="linksDisplay" class="datasetDisplay">
        <table id="linksTable" class="table table-bordered table-striped table-condensed">
          <tr class="tableTitle"><td>Source name</td><td>Target name</td></tr>
        </table>
      </div>

      <!--User action buttons-->
      <div id="datasetControl">
        <table><tr>
          <td><button id="bt-addNode" class="btn">Add a node</button></td>
          <td><button id="bt-addLink" class="btn">Add a link</button></td>
          <td><button id="bt-addBatch" class="btn">Add nodes and links from a file</button></td>
        </tr></table>
        <div id="actionField">
          <div id="addNodeField" class="form-inline">
            <input type="text" placeholder="Node name" name="nodeName">
            <input type="text" placeholder="Node depth" name="nodeDepth">
            <select data-placeholder="Parent name" class="chzn-select" style="width:250px;" id="nodeParent">
              <option></option>
            </select>
            <button id="bt-addNodeSubmit" class="btn" type="submit">Add</button>
          </div>
          <div id="addLinkField" style="display:none">
            <select data-placeholder="Source name" class="chzn-select" style="width:250px;" id="sourceName">
              <option></option>
            </select>
            <select data-placeholder="Target name" class="chzn-select" style="width:250px;" id="targetName">
              <option></option>
            </select>            
            <button id="bt-addLinkSubmit" class="btn" type="submit">Add</button>
          </div>
          <div id="addBatchField" style="display:none">
          </div>
        </div>
      </div>
    <!--LIBRARIES-->
    <script type="text/javascript" src="../lib/jquery-1.7.2.min.js"></script>
    <script type="text/javascript" src="../lib/bootstrap/js/bootstrap.min.js"></script>
    <script type="text/javascript" src="../lib/d3.v2.js"></script>
    <script type="text/javascript" src="../lib/chosen/chosen.jquery.js"></script>
    <script type="text/javascript" src="../lib/jquery-ui/js/jquery-ui.js"></script>

    <script type="text/javascript" src="../js/dataMngr.js"></script>
  </body>
</html>
