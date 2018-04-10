<?php

header('Content-Type: application/json');
echo json_encode(dir_to_jstree_array("../file-upload/images"));

function dir_to_jstree_array($dir, $order = "a", $ext = array()) {

    if(empty($ext)) {
        $ext = array (
            "jpg", "gif", "jpeg", "png", "doc", "xls", "pdf", "tif", "html", "js", "css"
        );
    }

    $listDir = array(
        'text' => basename($dir),
        'type' => 'folder',
        'metadata' => array (
            'id' => $dir
        ),
        'children' => array()
    );

    $files = array();
    $dirs = array();

    if($handler = opendir($dir))
    {
        while (($sub = readdir($handler)) !== FALSE)
        {
            if ($sub != "." && $sub != "..")
            {
                if(is_file($dir."/".$sub))
                {
                    $extension = pathinfo($dir."/".$sub, PATHINFO_EXTENSION);
                    if(in_array($extension, $ext)) {
                        $files []= $sub;
                    }
                }elseif(is_dir($dir."/".$sub))
                {
                    $dirs []= $dir."/".$sub;
                }
            }
        }

        if($order === "a") {
            asort($dirs);
        } else {
            arsort($dirs);
        }

        foreach($dirs as $d) {
            $listDir['children'][]= dir_to_jstree_array($d);
        }

        if($order === "a") {
            asort($files);
        } else {
            arsort($files);
        }

        foreach($files as $file) {
            $listDir['children'][]= $file;
        }

        closedir($handler);
    }
    return $listDir;
}