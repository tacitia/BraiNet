<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Brain Circuits Diagram</title>

    <!--Stylesheets-->
    <link rel="stylesheet" href="../lib/bootstrap/css/bootstrap.min.css" media="all" />
    <link rel="stylesheet" href="../lib/chosen/chosen.css" media="all" />
    <link rel="stylesheet" href="../css/style-ui.css" media="all" type="text/css" charset="utf-8">
    <link rel="stylesheet" href="../css/colors.css" media="all" type="text/css" charset="utf-8">
    <link rel="stylesheet" href="../lib/jquery-ui/css/redmond/jquery-ui.css" media="all" />

    <!-- HTML5 shim, IE6-8 support of HTML5 elements -->
    <!--[if lt IE 9]>
    <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->
    <style>
        div.dataTables_length {
            float:left;
        }
        div.dataTables_filter {
            float:right;
        }
        select {
            width:75px;
        }
        body {
        	margin:20px;
        }
        .section {
        	margin:20px;
        }
    </style>
  </head>
  <body>
      <?php
        echo '<h2>Dataset: ' . $_GET["datasetName"] . '</h2>';
        echo '<span id="datasetID" style="display:none">' . $_GET["datasetID"] . '</span>'
      ?>

	  <div class="section">
	  <h3>Brain regions</h3>
      <table class="table table-bordered table-striped" cellpadding="0" cellspacing="0" border="0" class="display" id="nodesDisplay">
        <thead>
          <tr>
            <th>Brain Region</th>
            <th>Depth</th>
            <th>Location</th>
            <th>Notes</th>
            <th style="width:100px"></th>
          </tr>
        </thead>

        <tbody>
        </tbody>
      </table>
      </div>

	  <div class="section">
	  <h3>Connections</h3>
      <table class="table table-bordered table-striped" cellpadding="0" cellspacing="0" border="0" class="display" id="linksDisplay">
        <thead>
          <tr>
            <th>Start</th>
            <th>End</th>
            <th>Notes</th>
            <th style="width:100px"></th>
          </tr>
        </thead>

        <tbody>
        </tbody>
      </table>
	  </div>
	
      <!--User action buttons-->

	  <div class="section">
	  <h3>Add new data</h3>
      <div id="datasetControl">
        <table><tr>
          <td><button id="bt-addNode" class="btn">Add a brain region/cell group</button></td>
          <td><button id="bt-addLink" class="btn">Add a projection/connection</button></td>
          <td><button id="bt-addBatch" class="btn">Create a network from a file</button></td>
        </tr></table>
        <div id="actionField">
          <div id="addNodeField" class="form-inline">
            <input type="text" placeholder="Name of the region/cell group" name="nodeName">
            <input type="text" placeholder="Depth (1 for the highest level)" name="nodeDepth">
            <select data-placeholder="Located within" class="chzn-select" style="width:250px;" id="nodeParent">
              <option></option>
            </select>
            <input type="text" placeholder="Notes" name="nodeNotes" class="input-xxlarge">
            <select data-placeholder="Brodmann area" class="chzn-select"
style="width:250px;" id="brodmannArea">
				<option</option>
			</select>
            <button id="bt-addNodeSubmit" class="btn" type="submit">Add</button>
          </div>
          <div id="addLinkField" style="display:none">
            <select data-placeholder="Start from..." class="chzn-select" style="width:250px;" id="sourceName">
              <option></option>
            </select>
            <select data-placeholder="End at..." class="chzn-select" style="width:250px;" id="targetName">
              <option></option>
            </select>
            <select data-placeholder="Select an attribute" class="chzn-select" style="width:250px;" id="attrName">
              <option></option>
            </select> 
            <input type="text" placeholder="Attribute value" name="attrValue">
            <input type="text" placeholder="Notes" name="linkNotes" class="input-xxlarge">
            <button id="bt-addLinkSubmit" class="btn" type="submit">Add</button>
            <div>
              <input type="text" placeholder="Attribute name" name="newAttrName">
              <select data-placeholder="Attribute type" class="chzn-select" style="width:250px;" id="attrType">
                <option value="nominal">Nominal</option>
                <option value="ordinal">Ordinal</option>
                <option value="numeric">Numeric</option>
              </select> 
              <button id="bt-addLinkAttrSubmit" class="btn" type="submit">Add a new attribute type</button>
            </div>
          </div>
          <div id="addBatchField" style="display:none">
          </div>
        </div>
      </div>
      </div>

    <!--LIBRARIES-->
    <script type="text/javascript" src="../lib/datatables/media/js/jquery.js"></script>
    <script type="text/javascript" src="../lib/datatables/media/js/jquery.dataTables.min.js"></script>

    <script type="text/javascript" src="../lib/bootstrap/js/bootstrap.min.js"></script>
    <script type="text/javascript" src="../lib/d3.v2.min.js"></script>
    <script type="text/javascript" src="../lib/chosen/chosen.jquery.min.js"></script>
    <script type="text/javascript" src="../lib/jquery-ui/js/jquery-ui.js"></script>


    <script type="text/javascript" src="../js/dataMngr.js"></script>
  </body>
</html>
