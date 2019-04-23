use sdl2::pixels::Color;
use sdl2::rect::Rect;
use sdl2::render::Canvas;
use sdl2::video::Window;
use std::collections::HashMap;

extern crate rand;

use rand::Rng;

const MAZE: bool = false;

#[derive(Debug)]
pub struct Cell {
  pub index: u32,
  pub x: u32,
  pub y: u32,
  rect_size: u32,
  pub wall: bool,
}

impl Cell {
  pub fn draw(&self, canvas: &mut Canvas<Window>) {
    let rectangle = Rect::new(
      (self.x * self.rect_size) as i32,
      (self.y * self.rect_size) as i32,
      self.rect_size,
      self.rect_size,
    );
    if self.wall {
      canvas.fill_rect(rectangle).err();
    } else {
      // canvas.draw_rect(rectangle).err();
    };
  }
  pub fn draw_color(&self, canvas: &mut Canvas<Window>, color: Color) {
    canvas.set_draw_color(color);
    let rectangle = Rect::new(
      (self.x * self.rect_size) as i32,
      (self.y * self.rect_size) as i32,
      (self.rect_size as f32 * 0.9) as u32,
      (self.rect_size as f32 * 0.9) as u32,
    );
    canvas.fill_rect(rectangle).err();
  }
}

fn x_y_to_index(x: u32, y: u32, grid_size: u32) -> usize {
  return (y * grid_size + x) as usize;
}

pub struct RemoveWall {
  pub x1: u32,
  pub y1: u32,
  pub x2: u32,
  pub y2: u32,
}

#[derive(Debug)]
pub struct Board {
  grid_size: u32,
  pub rect_size: u32,
  pub cells: Vec<Cell>,
}
impl Board {
  pub fn new(grid_size: u32, rect_size: u32) -> Self {
    let mut rng = rand::thread_rng();
    let board = Board {
      grid_size,
      rect_size,
      cells: (0..grid_size * grid_size)
        .map(|index| {
          let x = index % grid_size;
          let y = (index - x) / grid_size;
          let wall: bool;
          if MAZE {
            if y % 2 == 0 {
              wall = x % 2 != 0;
            } else {
              wall = true;
            }
          } else {
            if rng.gen::<f64>() < 0.33 {
              wall = true
            } else {
              wall = false
            }
          }
          return Cell {
            index,
            x,
            y,
            rect_size,
            wall,
          };
        })
        .collect(),
    };
    return board;
  }

  pub fn get_neighbors(&self, x: u32, y: u32, astar: bool) -> Vec<&Cell> {
    let mut neighbors = Vec::new();
    let delta;
    if astar == true {
      delta = 1
    } else {
      delta = 2
    }
    if y >= delta {
      (&mut neighbors).push(&self.cells[x_y_to_index(x, y - delta, self.grid_size)])
    }
    if x + delta < self.grid_size {
      neighbors.push(&self.cells[x_y_to_index(x + delta, y, self.grid_size)])
    }
    if y + delta < self.grid_size {
      neighbors.push(&self.cells[x_y_to_index(x, y + delta, self.grid_size)])
    }
    if x >= delta {
      neighbors.push(&self.cells[x_y_to_index(x - delta, y, self.grid_size)])
    }
    return neighbors;
  }

  pub fn remove_wall_between(&mut self, x1: u32, y1: u32, x2: u32, y2: u32) {
    if x2 > x1 {
      self.cells[x_y_to_index(x2 - 1, y2, self.grid_size)].wall = false
    } else if x2 < x1 {
      self.cells[x_y_to_index(x2 + 1, y2, self.grid_size)].wall = false
    }
    if y2 > y1 {
      self.cells[x_y_to_index(x2, y2 - 1, self.grid_size)].wall = false
    } else if y2 < y1 {
      self.cells[x_y_to_index(x2, y2 + 1, self.grid_size)].wall = false
    }
  }

  pub fn generate_maze(&mut self) -> Vec<RemoveWall> {
    let mut rng = rand::thread_rng();
    let mut stack: Vec<&Cell> = Vec::new();
    let mut visited = HashMap::new();
    let mut remove_wall = Vec::new();

    let mut randIndex = rng.gen_range(0, &self.cells.len()) as usize;
    while randIndex % 2 != 0 {
      randIndex = rng.gen_range(0, &self.cells.len()) as usize;
    }
    let start = &self.cells[randIndex];
    visited.insert(start.index, true);

    let mut current_x = start.x;
    let mut current_y = start.y;
    let mut all_neighbors;
    while visited.keys().len() < ((self.grid_size * self.grid_size) as usize) {
      all_neighbors = self.get_neighbors(current_x, current_y, false);
      let neighbors: Vec<&&Cell> = all_neighbors
        .iter()
        .filter(|item| visited.contains_key(&item.index) == false)
        .collect();

      if neighbors.len() == 0 {
        let popped = stack.pop();
        if let Some(cell) = popped {
          current_x = cell.x;
          current_y = cell.y;
        } else {
          return remove_wall;
        }
      } else {
        let random_neighbor = neighbors[rng.gen_range(0, neighbors.len()) as usize];
        remove_wall.push(RemoveWall {
          x1: current_x,
          y1: current_y,
          x2: random_neighbor.x,
          y2: random_neighbor.y,
        });
        stack.push(random_neighbor);
        visited.insert(random_neighbor.index, true);
      }
    }
    return remove_wall;
  }

  pub fn draw_cells(&mut self, canvas: &mut Canvas<Window>) {
    let mut index = 0;
    while index < self.grid_size * self.grid_size {
      self.cells[index as usize].draw(canvas);
      index += 1;
    }
  }
}
