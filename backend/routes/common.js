const express = require('express');
const router = express.Router();
const helper = require('../helper/helpers');

// Get all contacts with optional filters
router.get('/getAvailableTags', async (req, res) => {
    try {
      const results = await helper.get_names("tag","*")
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

router.post('/taskTags/:id', async (req, res) => {
try {
    const taskId = req.params.id;
    const results = await helper.getTasktags(taskId)
    res.json(results);
} catch (err) {
    res.status(500).json({ error: err.message });
}
});

router.post('/addtaskTag/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        const {tagId} = req.body;
        
        const results = await helper.addNewRow("task__tag",'(fk_task_id,fk_tag_id)',`(${taskId},${tagId})`,[])
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    });

router.post('/addNewTag', async (req, res) => {
    try {
        const {tagName} = req.body; 
        const results = await helper.addNewRow('tag',`(display_name)`,`('${tagName}')`,['tag_id'])
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    });

router.delete('/taskTags/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        const {tagId} = req.body;
        const tableName = 'task__tag'
        helper.deleterow(tableName, ['fk_tag_id', 'fk_task_id'], [tagId, taskId])
        .then(response => res.json(response))
        .catch(error => console.error(error));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    });
  

module.exports = router;
